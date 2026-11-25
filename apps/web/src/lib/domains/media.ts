import type { ContentContext } from './content';

export const MEDIA_BUCKET = 'content-factory-media';

export async function listMediaSceneOptions(ctx: ContentContext) {
  const { data: scenes, error } = await ctx.supabase.from('script_scenes').select('id,position,script_version_id').eq('workspace_id', ctx.workspaceId).order('position').limit(500);
  if (error || !scenes?.length) return { data: [] as { id: string; label: string }[] };
  const versionIds = [...new Set(scenes.map((scene) => scene.script_version_id))];
  const { data: versions } = await ctx.supabase.from('script_versions').select('id,script_id,title,status').eq('workspace_id', ctx.workspaceId).in('id', versionIds);
  const scriptIds = [...new Set((versions ?? []).map((version) => version.script_id))];
  const { data: scripts } = scriptIds.length ? await ctx.supabase.from('scripts').select('id,topic_id,channel_id').eq('workspace_id', ctx.workspaceId).in('id', scriptIds) : { data: [] };
  const topicIds = [...new Set((scripts ?? []).map((script) => script.topic_id))];
  const { data: topics } = topicIds.length ? await ctx.supabase.from('topics').select('id,title').eq('workspace_id', ctx.workspaceId).in('id', topicIds) : { data: [] };
  const versionsById = new Map((versions ?? []).map((version) => [version.id, version]));
  const scriptsById = new Map((scripts ?? []).map((script) => [script.id, script]));
  const topicsById = new Map((topics ?? []).map((topic) => [topic.id, topic.title]));
  return { data: scenes.flatMap((scene) => {
    const version = versionsById.get(scene.script_version_id); const script = version ? scriptsById.get(version.script_id) : undefined;
    const title = script ? topicsById.get(script.topic_id) ?? version?.title : version?.title;
    return title ? [{ id: scene.id, label: `${title} · cena ${scene.position} · ${version?.status ?? 'roteiro'}` }] : [];
  }) };
}

export async function listMediaAssets(ctx: ContentContext, filters: { q?: string; kind?: 'image' | 'video' | 'audio' } = {}) {
  let query = ctx.supabase.from('media_assets').select('*').eq('workspace_id', ctx.workspaceId).order('created_at', { ascending: false }).limit(200);
  if (filters.kind) query = query.eq('kind', filters.kind);
  const q = filters.q?.trim().replace(/[^\p{L}\p{N}\s-]/gu, '').trim();
  if (q) query = query.or(`file_name.ilike.%${q}%,origin.ilike.%${q}%,author.ilike.%${q}%,license_name.ilike.%${q}%`);
  const { data, error } = await query;
  if (error) return { error: 'Não foi possível carregar a biblioteca de mídia.' };

  const assetIds = (data ?? []).map((asset) => asset.id);
  const [{ data: links }, { data: channels }] = await Promise.all([
    assetIds.length ? ctx.supabase.from('scene_media_assets').select('media_asset_id,script_scene_id').eq('workspace_id', ctx.workspaceId).in('media_asset_id', assetIds) : Promise.resolve({ data: [] }),
    ctx.supabase.from('channels').select('id,name').eq('workspace_id', ctx.workspaceId),
  ]);
  const sceneIds = (links ?? []).map((link) => link.script_scene_id);
  const { data: scenes } = sceneIds.length
    ? await ctx.supabase.from('script_scenes').select('id,position,script_version_id').eq('workspace_id', ctx.workspaceId).in('id', sceneIds)
    : { data: [] };
  const versionIds = [...new Set((scenes ?? []).map((scene) => scene.script_version_id))];
  const { data: versions } = versionIds.length
    ? await ctx.supabase.from('script_versions').select('id,script_id,title').eq('workspace_id', ctx.workspaceId).in('id', versionIds)
    : { data: [] };
  const scriptIds = [...new Set((versions ?? []).map((version) => version.script_id))];
  const { data: scripts } = scriptIds.length
    ? await ctx.supabase.from('scripts').select('id,topic_id,channel_id').eq('workspace_id', ctx.workspaceId).in('id', scriptIds)
    : { data: [] };
  const topicIds = [...new Set((scripts ?? []).map((script) => script.topic_id))];
  const { data: topics } = topicIds.length
    ? await ctx.supabase.from('topics').select('id,title').eq('workspace_id', ctx.workspaceId).in('id', topicIds)
    : { data: [] };
  const channelNames = new Map((channels ?? []).map((channel) => [channel.id, channel.name]));
  const topicsById = new Map((topics ?? []).map((topic) => [topic.id, topic.title]));
  const scriptsById = new Map((scripts ?? []).map((script) => [script.id, script]));
  const versionsById = new Map((versions ?? []).map((version) => [version.id, version]));
  const scenesById = new Map((scenes ?? []).map((scene) => [scene.id, scene]));
  const linkByAsset = new Map((links ?? []).map((link) => {
    const scene = scenesById.get(link.script_scene_id);
    const version = scene ? versionsById.get(scene.script_version_id) : undefined;
    const script = version ? scriptsById.get(version.script_id) : undefined;
    const title = script ? topicsById.get(script.topic_id) ?? version?.title : version?.title;
    const channel = script ? channelNames.get(script.channel_id) : undefined;
    return [link.media_asset_id, scene && title ? `Cena ${scene.position} · ${title}${channel ? ` · ${channel}` : ''}` : 'Cena vinculada'];
  }));
  const { data: signedAssets } = data?.length ? await ctx.supabase.storage.from(MEDIA_BUCKET).createSignedUrls(data.map((asset) => asset.storage_path), 3600) : { data: [] };
  const signedByPath = new Map((signedAssets ?? []).map((item) => [item.path, item.signedUrl]));
  return { data: (data ?? []).map((asset) => ({
    ...asset, signedUrl: signedByPath.get(asset.storage_path) ?? null,
    linkedScene: linkByAsset.get(asset.id) ?? null, channelName: channelNames.get(asset.channel_id) ?? 'Canal',
  })) };
}

export async function getSceneMedia(ctx: ContentContext, sceneIds: string[]) {
  if (!sceneIds.length) return { data: [] as { sceneId: string; asset: { id: string; file_name: string; kind: string; storage_path: string; source_url: string | null; license_name: string; author: string; attribution: string; signedUrl: string | null } }[] };
  const { data: links, error } = await ctx.supabase.from('scene_media_assets').select('script_scene_id,media_asset_id').eq('workspace_id', ctx.workspaceId).in('script_scene_id', sceneIds);
  if (error || !links?.length) return { data: [] };
  const { data: assets } = await ctx.supabase.from('media_assets').select('id,file_name,kind,storage_path,source_url,license_name,author,attribution').eq('workspace_id', ctx.workspaceId).in('id', links.map((link) => link.media_asset_id));
  const assetMap = new Map((assets ?? []).map((asset) => [asset.id, asset]));
  const entries = links.flatMap((link) => {
    const asset = assetMap.get(link.media_asset_id); if (!asset) return [];
    return [{ sceneId: link.script_scene_id, asset }];
  });
  const { data: signedAssets } = entries.length ? await ctx.supabase.storage.from(MEDIA_BUCKET).createSignedUrls(entries.map((entry) => entry.asset.storage_path), 3600) : { data: [] };
  const signedByPath = new Map((signedAssets ?? []).map((item) => [item.path, item.signedUrl]));
  return { data: entries.map((entry) => ({ sceneId: entry.sceneId, asset: { ...entry.asset, signedUrl: signedByPath.get(entry.asset.storage_path) ?? null } })) };
}
