import { z } from 'zod';

export const YOUTUBE_UPLOAD_SCOPE = 'https://www.googleapis.com/auth/youtube.upload';
export const YOUTUBE_READ_SCOPE = 'https://www.googleapis.com/auth/youtube.readonly';
const tokenResponseSchema = z.object({ access_token: z.string(), expires_in: z.number(), refresh_token: z.string().optional(), scope: z.string().optional(), token_type: z.string().optional() });

export function buildGoogleAuthorizationUrl(input: { clientId: string; redirectUri: string; state: string }) {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search = new URLSearchParams({ client_id: input.clientId, redirect_uri: input.redirectUri, response_type: 'code', scope: `${YOUTUBE_READ_SCOPE} ${YOUTUBE_UPLOAD_SCOPE}`, access_type: 'offline', prompt: 'consent', include_granted_scopes: 'true', state: input.state }).toString();
  return url.toString();
}

async function tokenRequest(values: Record<string, string>, clientId: string, clientSecret: string, redirectUri?: string) {
  const body = new URLSearchParams({ client_id: clientId, client_secret: clientSecret, ...values, ...(redirectUri ? { redirect_uri: redirectUri } : {}) });
  const response = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body, signal: AbortSignal.timeout(20_000) });
  const payload: unknown = await response.json().catch(() => null);
  if (!response.ok) throw new Error('O Google OAuth não aceitou a solicitação de token.');
  return tokenResponseSchema.parse(payload);
}

export function exchangeGoogleCode(code: string, clientId: string, clientSecret: string, redirectUri: string) {
  return tokenRequest({ code, grant_type: 'authorization_code' }, clientId, clientSecret, redirectUri);
}

export function refreshGoogleAccessToken(refreshToken: string, clientId: string, clientSecret: string) {
  return tokenRequest({ refresh_token: refreshToken, grant_type: 'refresh_token' }, clientId, clientSecret);
}

export async function revokeGoogleToken(token: string) {
  const response = await fetch('https://oauth2.googleapis.com/revoke', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams({ token }), signal: AbortSignal.timeout(15_000) });
  if (!response.ok && response.status !== 400) throw new Error('Google não confirmou a revogação da conexão.');
}

export async function getYouTubeChannel(accessToken: string) {
  const response = await fetch('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true', { headers: { Authorization: `Bearer ${accessToken}` }, signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error('Não foi possível consultar o canal autorizado do YouTube.');
  const payload = z.object({ items: z.array(z.object({ id: z.string(), snippet: z.object({ title: z.string() }) })).min(1) }).parse(await response.json());
  return { id: payload.items[0].id, name: payload.items[0].snippet.title };
}

const youtubeUploadResponse = z.object({ id: z.string() });
const CHUNK_SIZE = 8 * 1024 * 1024;

async function readYouTubeResponse(response: Response) {
  const payload: unknown = await response.json().catch(() => null);
  return youtubeUploadResponse.parse(payload);
}

export async function uploadYouTubeVideo(input: {
  accessToken: string; bytes: Uint8Array; title: string; description: string; tags: string[];
  visibility: 'private' | 'public'; scheduledAt?: string; resumableUri?: string;
  onSession?: (uri: string) => Promise<void>;
}) {
  const { bytes } = input;
  if (!bytes.byteLength || bytes.byteLength > 50 * 1024 * 1024) throw new Error('O vídeo deve ter entre 1 byte e 50 MB.');
  let session = input.resumableUri;
  if (!session) {
    const metadata = { snippet: { title: input.title, description: [input.description, input.tags.map((tag) => `#${tag.replace(/^#+/, '')}`).join(' ')].filter(Boolean).join('\n\n'), tags: input.tags, categoryId: '27' }, status: { privacyStatus: input.scheduledAt ? 'private' : input.visibility, ...(input.scheduledAt ? { publishAt: input.scheduledAt } : {}) } };
    const response = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
      method: 'POST', headers: { Authorization: `Bearer ${input.accessToken}`, 'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Type': 'video/mp4', 'X-Upload-Content-Length': String(bytes.byteLength) },
      body: JSON.stringify(metadata), signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) throw new Error(`YouTube recusou a inicialização do upload (HTTP ${response.status}).`);
    session = response.headers.get('location') ?? undefined;
    if (!session || !session.startsWith('https://www.googleapis.com/upload/youtube/v3/videos')) throw new Error('YouTube não retornou uma sessão de upload válida.');
    await input.onSession?.(session);
  }

  const probe = await fetch(session, { method: 'PUT', headers: { Authorization: `Bearer ${input.accessToken}`, 'Content-Length': '0', 'Content-Range': `bytes */${bytes.byteLength}` }, signal: AbortSignal.timeout(30_000) });
  if (probe.status === 200 || probe.status === 201) return readYouTubeResponse(probe);
  if (probe.status !== 308) throw new Error(`A sessão resumível do YouTube expirou ou falhou (HTTP ${probe.status}).`);
  const range = probe.headers.get('range');
  let offset = range ? Number(range.match(/bytes=0-(\d+)/)?.[1] ?? -1) + 1 : 0;
  let transportFailures = 0;
  while (offset < bytes.byteLength) {
    const end = Math.min(offset + CHUNK_SIZE, bytes.byteLength) - 1;
    let response: Response;
    try {
      response = await fetch(session, { method: 'PUT', headers: { Authorization: `Bearer ${input.accessToken}`, 'Content-Type': 'video/mp4', 'Content-Length': String(end - offset + 1), 'Content-Range': `bytes ${offset}-${end}/${bytes.byteLength}` }, body: bytes.slice(offset, end + 1), signal: AbortSignal.timeout(120_000) });
    } catch {
      transportFailures += 1;
      if (transportFailures > 5) throw new Error('O upload ao YouTube excedeu as tentativas de retomada.');
      const current = await fetch(session, { method: 'PUT', headers: { Authorization: `Bearer ${input.accessToken}`, 'Content-Length': '0', 'Content-Range': `bytes */${bytes.byteLength}` }, signal: AbortSignal.timeout(30_000) });
      if (current.status === 200 || current.status === 201) return readYouTubeResponse(current);
      if (current.status !== 308) throw new Error('Não foi possível retomar o upload ao YouTube.');
      const received = current.headers.get('range'); offset = received ? Number(received.match(/bytes=0-(\d+)/)?.[1] ?? -1) + 1 : 0;
      continue;
    }
    if (response.status === 200 || response.status === 201) return readYouTubeResponse(response);
    if (response.status !== 308) throw new Error(`O upload ao YouTube falhou (HTTP ${response.status}).`);
    transportFailures = 0;
    const received = response.headers.get('range');
    const nextOffset = received ? Number(received.match(/bytes=0-(\d+)/)?.[1] ?? -1) + 1 : 0;
    if (nextOffset <= offset) throw new Error('O upload ao YouTube não avançou.');
    offset = nextOffset;
  }
  throw new Error('O YouTube não confirmou a conclusão do upload.');
}

