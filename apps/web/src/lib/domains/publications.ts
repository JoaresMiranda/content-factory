import type { ContentContext } from './content';

export async function listPublicationData(ctx: ContentContext) {
  const [accountsResult, videosResult, publicationsResult] = await Promise.all([
    ctx.supabase.from('platform_accounts').select('id,channel_id,platform,display_name,connection_status').eq('workspace_id', ctx.workspaceId),
    ctx.supabase.from('videos').select('id,channel_id,script_version_id,status,video_storage_path,thumbnail_storage_path,duration_seconds,created_at').eq('workspace_id', ctx.workspaceId).eq('status', 'approved').order('created_at', { ascending: false }).limit(100),
    ctx.supabase.from('publications').select('id,video_id,platform_account_id,status,title,visibility,scheduled_at,external_id,external_url,last_error,created_at,uploaded_at').eq('workspace_id', ctx.workspaceId).order('created_at', { ascending: false }).limit(100),
  ]);
  if (accountsResult.error || videosResult.error || publicationsResult.error) return { error: 'Não foi possível carregar as contas e publicações do workspace.' };
  const [allVideosResult, channelsResult] = await Promise.all([
    (publicationsResult.data ?? []).length ? ctx.supabase.from('videos').select('id,channel_id,script_version_id').eq('workspace_id', ctx.workspaceId).in('id', publicationsResult.data.map(({ video_id }) => video_id)) : Promise.resolve({ data: [], error: null }),
    ctx.supabase.from('channels').select('id,name').eq('workspace_id', ctx.workspaceId),
  ]);
  if (allVideosResult.error || channelsResult.error) return { error: 'Não foi possível carregar as publicações existentes.' };
  const allVideos = allVideosResult.data;
  const versionIds = [...new Set([...(videosResult.data ?? []).map((item) => item.script_version_id), ...(allVideos ?? []).map((item) => item.script_version_id)])];
  const versionsResult = versionIds.length ? await ctx.supabase.from('script_versions').select('id,title').eq('workspace_id', ctx.workspaceId).in('id', versionIds) : { data: [], error: null };
  if (versionsResult.error) return { error: 'Não foi possível carregar os títulos dos vídeos.' };
  const channelById = new Map((channelsResult.data ?? []).map(({ id, name }) => [id, name]));
  const versionById = new Map((versionsResult.data ?? []).map(({ id, title }) => [id, title]));
  const approvedVideos = await Promise.all((videosResult.data ?? []).map(async (video) => {
    const [{ data: playback }, { data: thumbnail }] = await Promise.all([
      ctx.supabase.storage.from('content-factory-media').createSignedUrl(video.video_storage_path, 3600),
      ctx.supabase.storage.from('content-factory-media').createSignedUrl(video.thumbnail_storage_path, 3600),
    ]);
    return { id: video.id, channelId: video.channel_id, title: versionById.get(video.script_version_id) ?? 'Vídeo aprovado', channelName: channelById.get(video.channel_id) ?? 'Canal', durationSeconds: video.duration_seconds, playbackUrl: playback?.signedUrl ?? null, thumbnailUrl: thumbnail?.signedUrl ?? null };
  }));
  const videoById = new Map((allVideos ?? []).map((video) => [video.id, video]));
  const accounts = (accountsResult.data ?? []).map((account) => ({ ...account, channelName: channelById.get(account.channel_id) ?? 'Canal' }));
  const publications = (publicationsResult.data ?? []).map((publication) => {
    const video = videoById.get(publication.video_id);
    return { ...publication, videoTitle: video ? versionById.get(video.script_version_id) ?? 'Vídeo' : 'Vídeo removido', channelName: video ? channelById.get(video.channel_id) ?? 'Canal' : 'Canal' };
  });
  return { data: { accounts, approvedVideos, publications } };
}
