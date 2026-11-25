import { timingSafeEqual } from 'node:crypto';
import { decryptOAuthToken, encryptOAuthToken, getYouTubeVideoMetrics, refreshGoogleAccessToken } from '@content-factory/integrations';
import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';

export const runtime = 'nodejs';
export const maxDuration = 120;

function authorized(request: Request, secret: string) {
  const provided = request.headers.get('authorization') ?? '';
  const expected = `Bearer ${secret}`;
  const a = Buffer.from(provided); const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || !authorized(request, secret)) return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
  const supabase = createAdminClient();
  if (!supabase) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY não está configurada no servidor.' }, { status: 503 });
  const encryptionKey = process.env.OAUTH_TOKEN_ENCRYPTION_KEY;
  const clientId = process.env.YOUTUBE_CLIENT_ID; const clientSecret = process.env.YOUTUBE_CLIENT_SECRET;
  if (!encryptionKey || !clientId || !clientSecret) return NextResponse.json({ error: 'A configuração OAuth do YouTube está pendente.' }, { status: 503 });

  const { data: publications, error: publicationError } = await supabase.from('publications')
    .select('id,workspace_id,channel_id,platform_account_id,external_id,uploaded_at,created_at')
    .eq('platform', 'youtube').not('external_id', 'is', null).in('status', ['published', 'scheduled', 'uploaded_private']).order('uploaded_at');
  if (publicationError) return NextResponse.json({ error: 'Não foi possível carregar publicações para coletar métricas.' }, { status: 500 });
  if (!publications?.length) return NextResponse.json({ processed: 0, snapshots: 0, errors: [] });

  const accountIds = [...new Set(publications.map(({ platform_account_id }) => platform_account_id))];
  const [{ data: accounts, error: accountsError }, { data: secrets, error: secretsError }] = await Promise.all([
    supabase.from('platform_accounts').select('id,connection_status').in('id', accountIds).eq('platform', 'youtube'),
    supabase.from('platform_account_secrets').select('platform_account_id,access_token_ciphertext,refresh_token_ciphertext,access_token_expires_at,refresh_token_expires_at').in('platform_account_id', accountIds),
  ]);
  if (accountsError || secretsError) return NextResponse.json({ error: 'Não foi possível carregar as conexões autorizadas.' }, { status: 500 });
  const accountById = new Map((accounts ?? []).map((account) => [account.id, account]));
  const secretById = new Map((secrets ?? []).map((token) => [token.platform_account_id, token]));
  const today = new Date(); const endDate = new Date(today.getTime() - 86_400_000).toISOString().slice(0, 10);
  const capturedOn = today.toISOString().slice(0, 10);
  let snapshots = 0;
  const errors: { accountId: string; message: string }[] = [];
  const grouped = new Map<string, typeof publications>();
  for (const publication of publications) grouped.set(publication.platform_account_id, [...(grouped.get(publication.platform_account_id) ?? []), publication]);

  for (const [accountId, items] of grouped) {
    try {
      const account = accountById.get(accountId); const stored = secretById.get(accountId);
      if (!account || account.connection_status !== 'connected' || !stored) throw new Error('Conexão indisponível; reconecte a conta YouTube.');
      let accessToken = decryptOAuthToken(stored.access_token_ciphertext, encryptionKey);
      if (Date.parse(stored.access_token_expires_at) < Date.now() + 60_000) {
        if (!stored.refresh_token_ciphertext || (stored.refresh_token_expires_at && Date.parse(stored.refresh_token_expires_at) < Date.now())) throw new Error('Autorização expirada; reconecte a conta YouTube.');
        const refreshed = await refreshGoogleAccessToken(decryptOAuthToken(stored.refresh_token_ciphertext, encryptionKey), clientId, clientSecret);
        accessToken = refreshed.access_token;
        const { error } = await supabase.from('platform_account_secrets').update({
          access_token_ciphertext: encryptOAuthToken(accessToken, encryptionKey), access_token_expires_at: new Date(Date.now() + refreshed.expires_in * 1000).toISOString(),
          ...(refreshed.refresh_token ? { refresh_token_ciphertext: encryptOAuthToken(refreshed.refresh_token, encryptionKey) } : {}), updated_at: new Date().toISOString(),
        }).eq('platform_account_id', accountId);
        if (error) throw new Error('Não foi possível salvar o token atualizado.');
      }
      const videoIds = [...new Set(items.flatMap((item) => item.external_id ? [item.external_id] : []))];
      if (!videoIds.length || items.every((item) => (item.uploaded_at ?? item.created_at).slice(0, 10) > endDate)) continue;
      const earliest = items.map((item) => (item.uploaded_at ?? item.created_at).slice(0, 10)).sort()[0];
      const metrics = await getYouTubeVideoMetrics({ accessToken, videoIds, startDate: earliest, endDate });
      const metricById = new Map(metrics.map((metric) => [metric.externalVideoId, metric]));
      const rows = items.flatMap((item) => {
        if (!item.external_id) return [];
        const metric = metricById.get(item.external_id);
        if (!metric) return [];
        return [{ workspace_id: item.workspace_id, channel_id: item.channel_id, publication_id: item.id, captured_on: capturedOn,
          views: metric.views, likes: metric.likes, comments: metric.comments, shares: metric.shares, watch_time_minutes: metric.watchTimeMinutes,
          average_view_duration_seconds: metric.averageViewDuration, average_view_percentage: metric.averageViewPercentage, subscribers_gained: metric.subscribersGained }];
      });
      if (rows.length) {
        const { error } = await supabase.from('video_metrics').upsert(rows, { onConflict: 'publication_id,captured_on' });
        if (error) throw new Error('Não foi possível gravar os snapshots de métricas.');
        snapshots += rows.length;
      }
    } catch (error) {
      errors.push({ accountId, message: error instanceof Error ? error.message.replace(/https?:\/\/\S+/g, '[url]').slice(0, 240) : 'Falha na coleta de métricas.' });
    }
  }
  return NextResponse.json({ processed: grouped.size, snapshots, errors });
}
