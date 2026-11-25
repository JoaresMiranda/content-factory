import { z } from 'zod';

export const YOUTUBE_UPLOAD_SCOPE = 'https://www.googleapis.com/auth/youtube.upload';
export const YOUTUBE_READ_SCOPE = 'https://www.googleapis.com/auth/youtube.readonly';
export const YOUTUBE_ANALYTICS_SCOPE = 'https://www.googleapis.com/auth/yt-analytics.readonly';
const tokenResponseSchema = z.object({ access_token: z.string(), expires_in: z.number(), refresh_token: z.string().optional(), scope: z.string().optional(), token_type: z.string().optional() });

export function buildGoogleAuthorizationUrl(input: { clientId: string; redirectUri: string; state: string }) {
  const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  url.search = new URLSearchParams({ client_id: input.clientId, redirect_uri: input.redirectUri, response_type: 'code', scope: `${YOUTUBE_READ_SCOPE} ${YOUTUBE_UPLOAD_SCOPE} ${YOUTUBE_ANALYTICS_SCOPE}`, access_type: 'offline', prompt: 'consent', include_granted_scopes: 'true', state: input.state }).toString();
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

const videoStatisticsSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    statistics: z.object({ viewCount: z.string().optional(), likeCount: z.string().optional(), commentCount: z.string().optional() }).optional(),
  })),
});
const analyticsReportSchema = z.object({
  columnHeaders: z.array(z.object({ name: z.string() })).optional(),
  rows: z.array(z.array(z.union([z.string(), z.number()]))).optional(),
});

export type YouTubeVideoMetrics = {
  externalVideoId: string;
  views: number | null;
  likes: number | null;
  comments: number | null;
  shares: number | null;
  watchTimeMinutes: number | null;
  averageViewDuration: number | null;
  averageViewPercentage: number | null;
  subscribersGained: number | null;
};

export async function getYouTubeVideoMetrics(input: {
  accessToken: string;
  videoIds: string[];
  startDate: string;
  endDate: string;
  fetcher?: typeof fetch;
}): Promise<YouTubeVideoMetrics[]> {
  const ids = [...new Set(input.videoIds)].filter(Boolean);
  if (!ids.length) return [];
  const fetcher = input.fetcher ?? fetch;
  const byId = new Map<string, YouTubeVideoMetrics>();
  for (let index = 0; index < ids.length; index += 50) {
    const chunk = ids.slice(index, index + 50);
    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.search = new URLSearchParams({ part: 'statistics', id: chunk.join(',') }).toString();
    const response = await fetcher(url, { headers: { Authorization: `Bearer ${input.accessToken}` }, signal: AbortSignal.timeout(20_000) });
    if (!response.ok) throw new Error(`YouTube não retornou métricas dos vídeos (HTTP ${response.status}).`);
    const payload = videoStatisticsSchema.parse(await response.json());
    for (const item of payload.items) {
      byId.set(item.id, {
        externalVideoId: item.id,
        views: item.statistics?.viewCount == null ? null : Number(item.statistics.viewCount),
        likes: item.statistics?.likeCount == null ? null : Number(item.statistics.likeCount),
        comments: item.statistics?.commentCount == null ? null : Number(item.statistics.commentCount),
        shares: null, watchTimeMinutes: null, averageViewDuration: null, averageViewPercentage: null, subscribersGained: null,
      });
    }
  }

  for (let index = 0; index < ids.length; index += 50) {
    const chunk = ids.slice(index, index + 50);
    const analytics = new URL('https://youtubeanalytics.googleapis.com/v2/reports');
    analytics.search = new URLSearchParams({
      ids: 'channel==MINE', startDate: input.startDate, endDate: input.endDate, dimensions: 'video',
      metrics: 'shares,estimatedMinutesWatched,averageViewDuration,averageViewPercentage,subscribersGained',
      filters: `video==${chunk.join(',')}`, maxResults: '200',
    }).toString();
    const analyticsResponse = await fetcher(analytics, { headers: { Authorization: `Bearer ${input.accessToken}` }, signal: AbortSignal.timeout(20_000) });
    if (!analyticsResponse.ok) continue;
    const report = analyticsReportSchema.parse(await analyticsResponse.json());
    const columns = new Map((report.columnHeaders ?? []).map((header, column) => [header.name, column]));
    for (const row of report.rows ?? []) {
      const id = String(row[columns.get('video') ?? 0]);
      const base = byId.get(id) ?? emptyYouTubeMetrics(id);
      const metric = (name: string) => {
        const column = columns.get(name);
        if (column === undefined || row[column] === undefined) return null;
        const value = Number(row[column]);
        return Number.isFinite(value) ? value : null;
      };
      byId.set(id, { ...base, shares: metric('shares'), watchTimeMinutes: metric('estimatedMinutesWatched'), averageViewDuration: metric('averageViewDuration'), averageViewPercentage: metric('averageViewPercentage'), subscribersGained: metric('subscribersGained') });
    }
  }
  return ids.map((id) => byId.get(id) ?? emptyYouTubeMetrics(id));
}

function emptyYouTubeMetrics(externalVideoId: string): YouTubeVideoMetrics {
  return { externalVideoId, views: null, likes: null, comments: null, shares: null, watchTimeMinutes: null, averageViewDuration: null, averageViewPercentage: null, subscribersGained: null };
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

