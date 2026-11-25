import { generateScript } from '@content-factory/ai';
import type { ScriptContent } from '@content-factory/shared';
import type { ContentContext } from './content';
import { getSceneMedia, MEDIA_BUCKET } from './media';

const queryClient = (ctx: ContentContext) => ctx.supabase;

export async function listScriptOverview(ctx: ContentContext) {
  const db = queryClient(ctx);
  const [{ data: topics, error: topicError }, { data: scripts, error: scriptError }, { data: channels }] = await Promise.all([
    db.from('topics').select('id,title,channel_id,status').eq('workspace_id', ctx.workspaceId).order('updated_at', { ascending: false }).limit(200),
    db.from('scripts').select('id,topic_id,channel_id,created_at,updated_at').eq('workspace_id', ctx.workspaceId).order('updated_at', { ascending: false }).limit(200),
    db.from('channels').select('id,name').eq('workspace_id', ctx.workspaceId),
  ]);
  if (topicError || scriptError) return { error: 'Não foi possível carregar roteiros e pautas aprovadas.' };
  const scriptIds = (scripts ?? []).map(({ id }) => id);
  const { data: versions, error: versionError } = scriptIds.length
    ? await db.from('script_versions').select('id,script_id,version_number,status,title,created_at,decision_at').eq('workspace_id', ctx.workspaceId).in('script_id', scriptIds).order('version_number', { ascending: false })
    : { data: [], error: null };
  if (versionError) return { error: 'Não foi possível carregar as versões dos roteiros.' };
  const latest = new Map<string, NonNullable<typeof versions>[number]>();
  for (const version of versions ?? []) if (!latest.has(version.script_id)) latest.set(version.script_id, version);
  const topicById = new Map((topics ?? []).map((topic) => [topic.id, topic]));
  const channelNames = new Map((channels ?? []).map((channel) => [channel.id, channel.name]));
  const entries = (scripts ?? []).flatMap((script) => {
    const topic = topicById.get(script.topic_id); const version = latest.get(script.id);
    return topic && version ? [{ scriptId: script.id, topicId: topic.id, topicTitle: topic.title, channelName: channelNames.get(topic.channel_id) ?? 'Canal', ...version }] : [];
  });
  const topicsWithoutScript = (topics ?? []).filter((topic) => topic.status === 'approved' && !(scripts ?? []).some((script) => script.topic_id === topic.id))
    .map((topic) => ({ ...topic, channelName: channelNames.get(topic.channel_id) ?? 'Canal' }));
  return { data: { entries, topicsWithoutScript } };
}

export async function loadScript(ctx: ContentContext, scriptId: string, versionId?: string) {
  const db = queryClient(ctx);
  const { data: script, error } = await db.from('scripts').select('id,topic_id,channel_id,created_at,updated_at').eq('id', scriptId).eq('workspace_id', ctx.workspaceId).maybeSingle();
  if (error || !script) return { error: 'Roteiro não encontrado neste workspace.' };
  const [{ data: topic }, { data: versions }] = await Promise.all([
    db.from('topics').select('id,title,status,summary,context,workspace_id').eq('id', script.topic_id).eq('workspace_id', ctx.workspaceId).maybeSingle(),
    db.from('script_versions').select('*').eq('script_id', script.id).eq('workspace_id', ctx.workspaceId).order('version_number', { ascending: false }),
  ]);
  if (!topic || !versions?.length) return { error: 'Não foi possível carregar o conteúdo deste roteiro.' };
  const version = (versionId && versions.find((item) => item.id === versionId)) || versions[0];
  const [{ data: scenes, error: sceneError }, { data: decisionUser }] = await Promise.all([
    db.from('script_scenes').select('*').eq('script_version_id', version.id).eq('workspace_id', ctx.workspaceId).order('position'),
    version.decision_by ? ctx.supabase.from('profiles').select('id,display_name').eq('id', version.decision_by).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  if (sceneError) return { error: 'Não foi possível carregar as cenas do roteiro.' };
  const sceneRows = scenes ?? [];
  const visualMedia = await getSceneMedia(ctx, sceneRows.map((scene) => scene.id));
  const audioIds = sceneRows.flatMap((scene) => scene.narration_audio_asset_id ? [scene.narration_audio_asset_id] : []);
  const { data: audioAssets } = audioIds.length ? await db.from('media_assets').select('id,storage_path').eq('workspace_id', ctx.workspaceId).in('id', audioIds) : { data: [] };
  const { data: signedAudio } = audioAssets?.length ? await db.storage.from(MEDIA_BUCKET).createSignedUrls(audioAssets.map((asset) => asset.storage_path), 3600) : { data: [] };
  const signedAudioByPath = new Map((signedAudio ?? []).map((item) => [item.path, item.signedUrl]));
  const audioMap = new Map((audioAssets ?? []).flatMap((asset) => {
    const scene = sceneRows.find((item) => item.narration_audio_asset_id === asset.id);
    return scene ? [[scene.id, signedAudioByPath.get(asset.storage_path) ?? null] as const] : [];
  }));
  return { data: { script, topic, version, versions, scenes: sceneRows, decisionUser, isLatest: version.id === versions[0].id, visualMedia: visualMedia.data, audioMap } };
}

export async function createScriptVersion(ctx: ContentContext, input: { topicId: string; scriptId: string | null; generationRunId?: string | null; content: ScriptContent }) {
  const { data, error } = await queryClient(ctx).rpc('create_script_version', {
    p_topic_id: input.topicId, p_script_id: input.scriptId, p_generation_run_id: input.generationRunId ?? null, p_content: input.content,
  });
  if (error || !data) return { error: 'Não foi possível salvar a nova versão do roteiro. Confira se a pauta continua aprovada e se todos os campos estão válidos.' };
  const result = data as { scriptId?: string; versionId?: string; versionNumber?: number };
  if (!result.scriptId || !result.versionId || !result.versionNumber) return { error: 'O banco não retornou os dados da versão criada.' };
  return { data: result };
}

export async function beginScriptGeneration(ctx: ContentContext, topicId: string) {
  const { data, error } = await queryClient(ctx).rpc('begin_script_generation', { p_topic_id: topicId });
  if (error || !data) return { error: error?.code === '23505' ? 'Já existe uma geração em andamento para esta pauta. Aguarde antes de tentar novamente.' : 'Não foi possível reservar a geração do roteiro.' };
  return { data };
}

export async function failScriptGeneration(ctx: ContentContext, runId: string, reason: string) {
  await queryClient(ctx).rpc('finish_script_generation', { p_run_id: runId, p_error_summary: reason.slice(0, 500) });
}

export async function decideScriptVersion(ctx: ContentContext, versionId: string, decision: 'pending_approval' | 'approved' | 'rejected', reason?: string) {
  const { error } = await queryClient(ctx).rpc('decide_script_version', { p_version_id: versionId, p_decision: decision, p_reason: reason ?? null });
  if (error) return { error: 'A decisão não foi registrada. Verifique se esta é a versão mais recente e se ainda está no estado esperado.' };
  return { ok: true };
}

export async function generateAndSaveScript(ctx: ContentContext, topicId: string, apiKey: string, model: string) {
  const db = queryClient(ctx);
  const { data: topic, error } = await db.from('topics').select('id,channel_id,category_id,title,summary,context,reference_url,evidence,status,workspace_id').eq('id', topicId).eq('workspace_id', ctx.workspaceId).maybeSingle();
  if (error || !topic) return { error: 'Pauta não encontrada neste workspace.' };
  if (topic.status !== 'approved') return { error: 'A geração de roteiro só está disponível para pautas aprovadas.' };

  const [{ data: categories }, { data: links }, { data: sources }, { data: channel }] = await Promise.all([
    db.from('categories').select('id,name').eq('id', topic.category_id ?? '').eq('workspace_id', ctx.workspaceId),
    db.from('topic_sources').select('source_id').eq('topic_id', topic.id).eq('workspace_id', ctx.workspaceId),
    db.from('sources').select('id,name,url,description').eq('workspace_id', ctx.workspaceId),
    db.from('channels').select('name,niche').eq('id', topic.channel_id).eq('workspace_id', ctx.workspaceId).maybeSingle(),
  ]);
  const sourceById = new Map((sources ?? []).map((source) => [source.id, source]));
  const evidence = Array.isArray(topic.evidence) ? topic.evidence.flatMap((item) => {
    if (!item || typeof item !== 'object' || Array.isArray(item) || typeof item.url !== 'string') return [];
    return [{ url: item.url, label: typeof item.title === 'string' ? item.title : 'Evidência da pesquisa', context: typeof item.publisher === 'string' ? item.publisher : '' }];
  }) : [];
  const linkedSources = (links ?? []).flatMap((link) => {
    const source = sourceById.get(link.source_id);
    return source ? [{ url: source.url, label: source.name, context: source.description ?? '' }] : [];
  });
  const references = [
    ...(topic.reference_url ? [{ url: topic.reference_url, label: 'Referência informada na pauta', context: topic.context ?? '' }] : []),
    ...evidence, ...linkedSources,
  ].filter((reference, index, all) => all.findIndex((other) => other.url === reference.url) === index);
  if (!references.length) return { error: 'Adicione uma referência factual à pauta antes de gerar o roteiro.' };

  const reservation = await beginScriptGeneration(ctx, topic.id);
  if ('error' in reservation) return reservation;

  try {
    const content = await generateScript({ apiKey, model, channelName: channel?.name ?? 'Canal', niche: channel?.niche ?? '',
      topic: { title: topic.title, summary: topic.summary, context: topic.context, categoryName: categories?.[0]?.name ?? null }, references });
    const saved = await createScriptVersion(ctx, { topicId: topic.id, scriptId: null, generationRunId: reservation.data, content });
    if ('error' in saved) {
      await failScriptGeneration(ctx, reservation.data, saved.error ?? 'Não foi possível salvar o roteiro.');
      return saved;
    }
    return { data: saved.data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Não foi possível gerar o roteiro.';
    await failScriptGeneration(ctx, reservation.data, message);
    return { error: message };
  }
}
