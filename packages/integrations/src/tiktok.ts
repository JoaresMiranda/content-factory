import { z } from 'zod';

export const TIKTOK_POSTING_SCOPES = ['user.info.basic', 'video.publish'] as const;
const tokenSchema = z.object({ access_token: z.string(), expires_in: z.number(), open_id: z.string(), refresh_token: z.string(), refresh_expires_in: z.number(), scope: z.string().optional(), token_type: z.string().optional() });

export function buildTikTokAuthorizationUrl(input: { clientKey: string; redirectUri: string; state: string }) {
  const url = new URL('https://www.tiktok.com/v2/auth/authorize/');
  url.search = new URLSearchParams({ client_key: input.clientKey, redirect_uri: input.redirectUri, response_type: 'code', scope: TIKTOK_POSTING_SCOPES.join(','), state: input.state }).toString();
  return url.toString();
}

async function tokenRequest(values: Record<string, string>, clientKey: string, clientSecret: string) {
  const body = new URLSearchParams({ client_key: clientKey, client_secret: clientSecret, ...values });
  const response = await fetch('https://open.tiktokapis.com/v2/oauth/token/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cache-Control': 'no-cache' }, body, signal: AbortSignal.timeout(20_000) });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error('TikTok OAuth não aceitou a solicitação de token.');
  const wrapped = z.object({ data: tokenSchema, error: z.object({ code: z.string(), message: z.string() }).optional() }).safeParse(payload);
  if (wrapped.success) {
    if (wrapped.data.error && wrapped.data.error.code !== 'ok') throw new Error('TikTok OAuth retornou um erro.');
    return wrapped.data.data;
  }
  return tokenSchema.parse(payload);
}

export function exchangeTikTokCode(code: string, clientKey: string, clientSecret: string, redirectUri: string) {
  return tokenRequest({ code, grant_type: 'authorization_code', redirect_uri: redirectUri }, clientKey, clientSecret);
}

export function refreshTikTokAccessToken(refreshToken: string, clientKey: string, clientSecret: string) {
  return tokenRequest({ refresh_token: refreshToken, grant_type: 'refresh_token' }, clientKey, clientSecret);
}

export async function getTikTokCreatorInfo(accessToken: string) {
  const response = await fetch('https://open.tiktokapis.com/v2/post/publish/creator_info/query/', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json; charset=UTF-8' }, body: '{}', signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error('Não foi possível consultar os requisitos de publicação do TikTok.');
  const payload = z.object({ data: z.object({ creator_username: z.string().optional(), creator_nickname: z.string().optional(), privacy_level_options: z.array(z.string()).optional(), max_video_post_duration_sec: z.number().optional() }), error: z.object({ code: z.string(), message: z.string() }) }).parse(await response.json());
  if (payload.error.code !== 'ok') throw new Error('TikTok não autorizou a consulta de requisitos do criador.');
  return payload.data;
}

export async function revokeTikTokToken(token: string, clientKey: string, clientSecret: string) {
  const response = await fetch('https://open.tiktokapis.com/v2/oauth/revoke/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'Cache-Control': 'no-cache' }, body: new URLSearchParams({ client_key: clientKey, client_secret: clientSecret, token }), signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error('TikTok não confirmou a revogação da conexão.');
}

