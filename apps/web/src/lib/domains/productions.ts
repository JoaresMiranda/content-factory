import type { ContentContext } from './content';
import { MEDIA_BUCKET } from './media';

export async function listProductions(ctx: ContentContext) {
  const db = ctx.supabase;
  const [versionsResult, jobsResult, videosResult] = await Promise.all([
    db.from('script_versions').select('id,script_id,version_number,status,title,estimated_duration_seconds,created_at').eq('workspace_id', ctx.workspaceId).order('version_number', { ascending: false }).limit(500),
    db.from('production_jobs').select('id,script_version_id,status,attempts,last_error,created_at,completed_at').eq('workspace_id', ctx.workspaceId).order('created_at', { ascending: false }).limit(100),
    db.from('videos').select('id,script_version_id,status,video_storage_path,thumbnail_storage_path,duration_seconds,file_size_bytes,created_at,decision_reason').eq('workspace_id', ctx.workspaceId).order('created_at', { ascending: false }).limit(100),
  ]);
  if (versionsResult.error || jobsResult.error || videosResult.error) return { error: 'Não foi possível carregar as produções deste workspace.' };
  const versions = versionsResult.data ?? [];
  const latestByScript = new Map<string, typeof versions[number]>();
  for (const version of versions) if (!latestByScript.has(version.script_id)) latestByScript.set(version.script_id, version);
  const latestApproved = [...latestByScript.values()].filter((version) => version.status === 'approved');
  const versionIds = latestApproved.map(({ id }) => id);
  const [scriptsResult, scenesResult] = await Promise.all([
    db.from('scripts').select('id,channel_id,topic_id').eq('workspace_id', ctx.workspaceId),
    versionIds.length ? db.from('script_scenes').select('id,script_version_id,position,narration_audio_asset_id').eq('workspace_id', ctx.workspaceId).in('script_version_id', versionIds).order('position') : Promise.resolve({ data: [], error: null }),
  ]);
  if (scriptsResult.error || scenesResult.error) return { error: 'Não foi possível conferir os assets das cenas.' };
  const scripts = scriptsResult.data; const scenes = scenesResult.data;
  const sceneIds = (scenes ?? []).map(({ id }) => id);
  const audioIds = (scenes ?? []).flatMap((scene) => scene.narration_audio_asset_id ? [scene.narration_audio_asset_id] : []);
  const [linksResult, audiosResult] = await Promise.all([
    sceneIds.length ? db.from('scene_media_assets').select('script_scene_id').eq('workspace_id', ctx.workspaceId).in('script_scene_id', sceneIds) : Promise.resolve({ data: [], error: null }),
    audioIds.length ? db.from('media_assets').select('id').eq('workspace_id', ctx.workspaceId).eq('kind', 'audio').in('id', audioIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (linksResult.error || audiosResult.error) return { error: 'Não foi possível validar os assets de áudio e vídeo.' };
  const links = linksResult.data; const audios = audiosResult.data;
  const visualScenes = new Set((links ?? []).map(({ script_scene_id }) => script_scene_id));
  const audioSet = new Set((audios ?? []).map(({ id }) => id));
  const channelIds = [...new Set((scripts ?? []).map(({ channel_id }) => channel_id))];
  const topicIds = [...new Set((scripts ?? []).map(({ topic_id }) => topic_id))];
  const [channelsResult, topicsResult] = await Promise.all([
    channelIds.length ? db.from('channels').select('id,name').eq('workspace_id', ctx.workspaceId).in('id', channelIds) : Promise.resolve({ data: [], error: null }),
    topicIds.length ? db.from('topics').select('id,title').eq('workspace_id', ctx.workspaceId).in('id', topicIds) : Promise.resolve({ data: [], error: null }),
  ]);
  if (channelsResult.error || topicsResult.error) return { error: 'Não foi possível carregar os nomes dos canais e pautas.' };
  const channels = channelsResult.data; const topics = topicsResult.data;
  const channelById = new Map((channels ?? []).map(({ id, name }) => [id, name]));
  const topicById = new Map((topics ?? []).map(({ id, title }) => [id, title]));
  const scriptById = new Map((scripts ?? []).map((script) => [script.id, script]));
  const scenesByVersion = new Map<string, typeof scenes>();
  for (const scene of scenes ?? []) scenesByVersion.set(scene.script_version_id, [...(scenesByVersion.get(scene.script_version_id) ?? []), scene]);
  const jobByVersion = new Map((jobsResult.data ?? []).map((job) => [job.script_version_id, job]));
  const candidates = latestApproved.map((version) => {
    const script = scriptById.get(version.script_id); const versionScenes = scenesByVersion.get(version.id) ?? [];
    const ready = versionScenes.length >= 3 && versionScenes.every((scene) => visualScenes.has(scene.id) && Boolean(scene.narration_audio_asset_id && audioSet.has(scene.narration_audio_asset_id)));
    return { ...version, channelName: script ? channelById.get(script.channel_id) ?? 'Canal' : 'Canal', topicTitle: script ? topicById.get(script.topic_id) ?? 'Pauta' : 'Pauta', sceneCount: versionScenes.length, ready, job: jobByVersion.get(version.id) ?? null };
  });
  const storedVideos = videosResult.data ?? [];
  const storedPaths = storedVideos.flatMap((video) => [video.video_storage_path, video.thumbnail_storage_path]);
  const signedResult = storedPaths.length ? await db.storage.from(MEDIA_BUCKET).createSignedUrls(storedPaths, 3600) : { data: [], error: null };
  if (signedResult.error) return { error: 'Não foi possível gerar links temporários para os vídeos.' };
  const signedByPath = new Map((signedResult.data ?? []).map((item) => [item.path, item.signedUrl]));
  const videos = storedVideos.map((video) => {
    const version = versions.find(({ id }) => id === video.script_version_id);
    return { ...video, title: version?.title ?? 'Vídeo renderizado', versionNumber: version?.version_number ?? 1, videoUrl: signedByPath.get(video.video_storage_path) ?? null, thumbnailUrl: signedByPath.get(video.thumbnail_storage_path) ?? null };
  });
  return { data: { candidates, jobs: jobsResult.data ?? [], videos } };
}
