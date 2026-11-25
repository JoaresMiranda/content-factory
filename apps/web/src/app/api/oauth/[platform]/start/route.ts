import { randomBytes } from 'node:crypto';
import { NextResponse } from 'next/server';
import { buildGoogleAuthorizationUrl, buildTikTokAuthorizationUrl } from '@content-factory/integrations';
import { getContentContext } from '@/lib/domains/content';
import { getOAuthProviderConfig, parseOAuthPlatform, signState } from '@/lib/oauth';

export async function GET(request: Request, { params }: { params: Promise<{ platform: string }> }) {
  const { platform: rawPlatform } = await params; const platform = parseOAuthPlatform(rawPlatform);
  const destination = new URL('/settings', request.url);
  if (!platform) { destination.searchParams.set('error', 'Plataforma OAuth inválida.'); return NextResponse.redirect(destination); }
  const channelId = new URL(request.url).searchParams.get('channelId') ?? '';
  const ctx = await getContentContext();
  if ('error' in ctx) { destination.searchParams.set('error', ctx.error); return NextResponse.redirect(destination); }
  if (!['owner', 'admin', 'editor'].includes(ctx.role)) { destination.searchParams.set('error', 'Seu papel não pode conectar plataformas.'); return NextResponse.redirect(destination); }
  const { data: channel } = await ctx.supabase.from('channels').select('id').eq('id', channelId).eq('workspace_id', ctx.workspaceId).maybeSingle();
  if (!channel) { destination.searchParams.set('error', 'Canal não encontrado neste workspace.'); return NextResponse.redirect(destination); }
  const config = getOAuthProviderConfig(platform);
  if (!config) { destination.searchParams.set('error', `Configure as credenciais e o callback ${platform.toUpperCase()} no ambiente do servidor.`); return NextResponse.redirect(destination); }
  try {
    const state = signState({ platform, channelId, workspaceId: ctx.workspaceId, userId: ctx.user.id, exp: Math.floor(Date.now() / 1000) + 600, nonce: randomBytes(24).toString('base64url') });
    const authUrl = platform === 'youtube'
      ? buildGoogleAuthorizationUrl({ clientId: config.clientId, redirectUri: config.redirectUri, state })
      : buildTikTokAuthorizationUrl({ clientKey: config.clientId, redirectUri: config.redirectUri, state });
    const response = NextResponse.redirect(authUrl);
    response.cookies.set(`cf_oauth_${platform}`, state, { httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', path: `/api/oauth/${platform}/callback`, maxAge: 600 });
    return response;
  } catch {
    destination.searchParams.set('error', 'A configuração segura do OAuth está incompleta.');
    return NextResponse.redirect(destination);
  }
}
