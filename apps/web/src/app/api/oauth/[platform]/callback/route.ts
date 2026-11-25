import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { decryptOAuthToken, encryptOAuthToken, exchangeGoogleCode, exchangeTikTokCode, getYouTubeChannel } from '@content-factory/integrations';
import { createAdminClient } from '@/lib/supabase/admin';
import { getContentContext } from '@/lib/domains/content';
import { getOAuthEncryptionKey, getOAuthProviderConfig, parseOAuthPlatform, verifyState } from '@/lib/oauth';

export async function GET(request: Request, { params }: { params: Promise<{ platform: string }> }) {
  const { platform: rawPlatform } = await params; const platform = parseOAuthPlatform(rawPlatform);
  const origin = new URL(request.url).origin; const failUrl = new URL('/settings', origin);
  const jar = await cookies(); const cookieName = platform ? `cf_oauth_${platform}` : '';
  const stateCookie = cookieName ? jar.get(cookieName)?.value : undefined;
  if (cookieName) jar.delete(cookieName);
  if (!platform) { failUrl.searchParams.set('error', 'Plataforma OAuth inválida.'); return NextResponse.redirect(failUrl); }
  const query = new URL(request.url).searchParams;
  if (query.has('error') || !stateCookie || query.get('state') !== stateCookie || !query.get('code')) {
    failUrl.searchParams.set('error', 'A conexão foi cancelada ou não passou pela verificação OAuth.'); return NextResponse.redirect(failUrl);
  }
  const ctx = await getContentContext();
  if ('error' in ctx) { failUrl.searchParams.set('error', ctx.error); return NextResponse.redirect(failUrl); }
  const admin = createAdminClient(); const encryptionKey = getOAuthEncryptionKey(); const config = getOAuthProviderConfig(platform);
  if (!admin || !encryptionKey || !config) { failUrl.searchParams.set('error', 'Configuração de credenciais ou armazenamento OAuth pendente no servidor.'); return NextResponse.redirect(failUrl); }
  try {
    const state = verifyState(stateCookie);
    if (state.platform !== platform || state.userId !== ctx.user.id || !['owner','admin','editor'].includes(ctx.role)) throw new Error('OAuth state mismatch');
    const { data: channel } = await ctx.supabase.from('channels').select('id').eq('id', state.channelId).eq('workspace_id', state.workspaceId).maybeSingle();
    if (!channel || ctx.workspaceId !== state.workspaceId) throw new Error('Workspace changed');

    let externalId: string; let displayName: string; let scopes: string[]; let accessToken: string; let refreshToken: string | null; let expiresIn: number; let refreshExpiresIn: number | null = null;
    if (platform === 'youtube') {
      const token = await exchangeGoogleCode(query.get('code')!, config.clientId, config.clientSecret, config.redirectUri);
      const youtubeChannel = await getYouTubeChannel(token.access_token);
      externalId = youtubeChannel.id; displayName = youtubeChannel.name; scopes = (token.scope ?? '').split(' ').filter(Boolean);
      accessToken = token.access_token; expiresIn = token.expires_in;
      const { data: oldAccount } = await admin.from('platform_accounts').select('id').eq('channel_id', channel.id).eq('platform', 'youtube').maybeSingle();
      const { data: oldSecret } = oldAccount ? await admin.from('platform_account_secrets').select('refresh_token_ciphertext').eq('platform_account_id', oldAccount.id).maybeSingle() : { data: null };
      refreshToken = token.refresh_token ?? (oldSecret?.refresh_token_ciphertext ? decryptOAuthToken(oldSecret.refresh_token_ciphertext, encryptionKey) : null);
      if (!refreshToken) throw new Error('O Google não retornou token de renovação; reconecte com acesso offline.');
    } else {
      const token = await exchangeTikTokCode(query.get('code')!, config.clientId, config.clientSecret, config.redirectUri);
      externalId = token.open_id; displayName = `TikTok ${token.open_id.slice(0, 8)}`; scopes = (token.scope ?? '').split(',').filter(Boolean);
      accessToken = token.access_token; refreshToken = token.refresh_token; expiresIn = token.expires_in; refreshExpiresIn = token.refresh_expires_in;
    }

    const { data: account, error: accountError } = await admin.from('platform_accounts').upsert({
      workspace_id: state.workspaceId, channel_id: channel.id, platform, external_account_id: externalId, display_name: displayName,
      scopes, connection_status: 'connected', connected_by: ctx.user.id, connected_at: new Date().toISOString(), updated_at: new Date().toISOString(),
    }, { onConflict: 'channel_id,platform' }).select('id').single();
    if (accountError || !account) throw new Error('Não foi possível gravar os metadados da conexão.');
    const { error: secretError } = await admin.from('platform_account_secrets').upsert({
      platform_account_id: account.id, workspace_id: state.workspaceId,
      access_token_ciphertext: encryptOAuthToken(accessToken, encryptionKey), refresh_token_ciphertext: refreshToken ? encryptOAuthToken(refreshToken, encryptionKey) : null,
      access_token_expires_at: new Date(Date.now() + expiresIn * 1000).toISOString(),
      refresh_token_expires_at: refreshExpiresIn ? new Date(Date.now() + refreshExpiresIn * 1000).toISOString() : null, updated_at: new Date().toISOString(),
    });
    if (secretError) throw new Error('Não foi possível armazenar os tokens OAuth com segurança.');
    const successUrl = new URL('/settings', origin); successUrl.searchParams.set('success', `${platform === 'youtube' ? 'YouTube' : 'TikTok'} conectado ao canal.`);
    return NextResponse.redirect(successUrl);
  } catch {
    failUrl.searchParams.set('error', 'Não foi possível concluir OAuth. Confira a aprovação do app, scopes e callback registrados no provedor.');
    return NextResponse.redirect(failUrl);
  }
}
