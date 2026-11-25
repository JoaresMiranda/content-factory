import { createClient } from '@supabase/supabase-js';
import { renderVideo, cleanRenderDirectory, type RenderInput } from '@content-factory/video-engine';
import { renderQueueMessageSchema } from '@content-factory/shared';
import { z } from 'zod';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const envSchema = z.object({
  SUPABASE_URL: z.string().url(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  WORKER_POLL_INTERVAL_MS: z.coerce.number().int().min(1000).max(60_000).default(5000),
  WORKER_VISIBILITY_SECONDS: z.coerce.number().int().min(60).max(3600).default(900),
});
const env = envSchema.parse(process.env);
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
const bucket = 'content-factory-media';
let stopped = false;
process.once('SIGINT', () => { stopped = true; });
process.once('SIGTERM', () => { stopped = true; });

const log = (event: string, data: Record<string, unknown> = {}) => console.log(JSON.stringify({ time: new Date().toISOString(), service: 'content-factory-worker', event, ...data }));
const pause = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function downloadAsset(path: string, outputPath: string) {
  const { data, error } = await supabase.storage.from(bucket).download(path);
  if (error || !data) throw new Error(`Não foi possível baixar asset ${path}: ${error?.message ?? 'arquivo ausente'}`);
  await writeFile(outputPath, Buffer.from(await data.arrayBuffer()));
}

async function processJob(jobId: string, workspaceId: string, messageId: number, attempt: number) {
  const workDir = await mkdtemp(join(tmpdir(), 'content-factory-render-'));
  const paths = [`${workspaceId}/renders/${jobId}/video.mp4`, `${workspaceId}/renders/${jobId}/thumbnail.jpg`];
  const heartbeat = setInterval(() => {
    void supabase.rpc('extend_render_job', { p_message_id: messageId, p_visibility_seconds: env.WORKER_VISIBILITY_SECONDS })
      .then(({ error }) => { if (error) log('heartbeat_failed', { jobId, message: error.message }); });
  }, Math.max(30_000, env.WORKER_VISIBILITY_SECONDS * 400));
  try {
    const { data: job, error: jobError } = await supabase.from('production_jobs').select('id,workspace_id,channel_id,script_id,script_version_id').eq('id', jobId).eq('workspace_id', workspaceId).single();
    if (jobError || !job) throw new Error(`Job indisponível: ${jobError?.message ?? 'not found'}`);
    const [{ data: version, error: versionError }, { data: scenes, error: scenesError }, { data: channel, error: channelError }] = await Promise.all([
      supabase.from('script_versions').select('title,estimated_duration_seconds').eq('id', job.script_version_id).eq('workspace_id', workspaceId).single(),
      supabase.from('script_scenes').select('id,position,duration_seconds,narration,narration_audio_asset_id').eq('script_version_id', job.script_version_id).eq('workspace_id', workspaceId).order('position'),
      supabase.from('channels').select('name,visual_identity').eq('id', job.channel_id).eq('workspace_id', workspaceId).single(),
    ]);
    if (versionError || scenesError || channelError || !version || !scenes || !channel) throw new Error('Não foi possível carregar os dados do roteiro e do canal.');
    const { data: links, error: linksError } = await supabase.from('scene_media_assets').select('script_scene_id,media_asset_id').eq('workspace_id', workspaceId).in('script_scene_id', scenes.map(({ id }) => id));
    if (linksError) throw new Error('Não foi possível carregar os visuais associados às cenas.');
    const assetIds = [...new Set([...(links ?? []).map((link) => link.media_asset_id), ...scenes.flatMap((scene) => scene.narration_audio_asset_id ? [scene.narration_audio_asset_id] : [])])];
    const { data: assets, error: assetsError } = await supabase.from('media_assets').select('id,kind,storage_path').eq('workspace_id', workspaceId).in('id', assetIds);
    if (assetsError || !assets) throw new Error('Não foi possível carregar os metadados dos assets.');
    const assetById = new Map(assets.map((asset) => [asset.id, asset]));
    const linkByScene = new Map((links ?? []).map((link) => [link.script_scene_id, assetById.get(link.media_asset_id)]));
    const renderScenes: RenderInput['scenes'] = [];
    for (const [index, scene] of scenes.entries()) {
      const visual = linkByScene.get(scene.id);
      const audio = scene.narration_audio_asset_id ? assetById.get(scene.narration_audio_asset_id) : null;
      if (!visual || (visual.kind !== 'image' && visual.kind !== 'video') || !audio || audio.kind !== 'audio') throw new Error(`Cena ${scene.position} não está pronta para renderizar.`);
      const visualPath = join(workDir, `visual-${index + 1}${visual.kind === 'video' ? '.mp4' : '.jpg'}`);
      const audioPath = join(workDir, `narration-${index + 1}.mp3`);
      await Promise.all([downloadAsset(visual.storage_path, visualPath), downloadAsset(audio.storage_path, audioPath)]);
      renderScenes.push({ position: scene.position, durationSeconds: scene.duration_seconds, narration: scene.narration, visualPath, visualKind: visual.kind, audioPath });
    }
    const primaryColor = typeof channel.visual_identity === 'object' && channel.visual_identity && 'primaryColor' in channel.visual_identity
      ? String(channel.visual_identity.primaryColor) : '#087e8b';
    const output = await renderVideo({ jobId, title: version.title, channelName: channel.name, primaryColor, scenes: renderScenes }, workDir);
    const videoBytes = await readFile(output.videoPath);
    const thumbnailBytes = await readFile(output.thumbnailPath);
    const [videoUpload, thumbUpload] = await Promise.all([
      supabase.storage.from(bucket).upload(paths[0], videoBytes, { contentType: 'video/mp4', upsert: true }),
      supabase.storage.from(bucket).upload(paths[1], thumbnailBytes, { contentType: 'image/jpeg', upsert: true }),
    ]);
    if (videoUpload.error || thumbUpload.error) throw new Error(`Falha ao enviar render: ${videoUpload.error?.message ?? thumbUpload.error?.message}`);
    const { error: completeError } = await supabase.rpc('complete_render_job', {
      p_message_id: messageId, p_job_id: jobId, p_workspace_id: workspaceId, p_video_path: paths[0], p_thumbnail_path: paths[1],
      p_duration_seconds: output.durationSeconds, p_file_size_bytes: output.fileSizeBytes,
    });
    if (completeError) throw new Error(`Não foi possível registrar o vídeo: ${completeError.message}`);
    log('job_completed', { jobId, workspaceId, durationSeconds: output.durationSeconds, fileSizeBytes: output.fileSizeBytes });
  } catch (error) {
    const message = (error instanceof Error ? error.message : 'Falha desconhecida').replace(/https?:\/\/\S+/g, '[url]').slice(0, 450);
    const { error: failError } = await supabase.rpc('fail_render_job', { p_message_id: messageId, p_job_id: jobId, p_workspace_id: workspaceId, p_error: message, p_attempt: attempt });
    log('job_failed', { jobId, workspaceId, attempt, message, retryScheduled: attempt < 3, failError: failError?.message });
  } finally {
    clearInterval(heartbeat);
    await cleanRenderDirectory(workDir);
  }
}

async function main() {
  log('worker_started');
  while (!stopped) {
    const { data, error } = await supabase.rpc('claim_render_job', { p_visibility_seconds: env.WORKER_VISIBILITY_SECONDS });
    if (error) { log('queue_poll_failed', { message: error.message }); await pause(env.WORKER_POLL_INTERVAL_MS); continue; }
    if (!data) { await pause(env.WORKER_POLL_INTERVAL_MS); continue; }
    const message = renderQueueMessageSchema.safeParse(data);
    if (!message.success) { log('invalid_queue_message'); await pause(env.WORKER_POLL_INTERVAL_MS); continue; }
    await processJob(message.data.jobId, message.data.workspaceId, Number((data as { messageId: number }).messageId), Number((data as { readCount: number }).readCount));
  }
  log('worker_stopped');
}

main().catch((error: unknown) => { log('worker_crashed', { message: error instanceof Error ? error.message : 'unknown error' }); process.exitCode = 1; });
