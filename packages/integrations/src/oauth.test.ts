import { describe, expect, it } from 'vitest';
import { vi } from 'vitest';
import { decryptOAuthToken, encryptOAuthToken, signOAuthState, verifyOAuthState } from './oauth-security';
import { buildGoogleAuthorizationUrl, uploadYouTubeVideo } from './youtube';
import { buildTikTokAuthorizationUrl } from './tiktok';

describe('OAuth and publishing foundations', () => {
  it('encrypts OAuth tokens with authenticated encryption', () => {
    const key = Buffer.alloc(32, 7).toString('base64');
    const token = encryptOAuthToken('secret-access-token', key);
    expect(token).not.toContain('secret-access-token');
    expect(decryptOAuthToken(token, key)).toBe('secret-access-token');
    expect(() => decryptOAuthToken(token, Buffer.alloc(32, 8).toString('base64'))).toThrow();
  });

  it('signs OAuth state and rejects tampering and expiry', () => {
    const secret = 'unit-test-state-secret-that-is-long-enough';
    const token = signOAuthState({ workspaceId: 'workspace', exp: 200 }, secret);
    expect(verifyOAuthState<{ workspaceId: string }>(token, secret, 100).workspaceId).toBe('workspace');
    expect(() => verifyOAuthState(token.replace(/.$/, 'x'), secret, 100)).toThrow();
    expect(() => verifyOAuthState(token, secret, 201)).toThrow(/expirado/);
  });

  it('requests offline Google upload permission without making videos public by default', () => {
    const url = new URL(buildGoogleAuthorizationUrl({ clientId: 'client', redirectUri: 'https://app.test/callback', state: 'signed' }));
    expect(url.searchParams.get('access_type')).toBe('offline');
    expect(url.searchParams.get('state')).toBe('signed');
    expect(url.searchParams.get('scope')).toContain('youtube.upload');
    expect(url.searchParams.get('scope')).toContain('youtube.readonly');
  });

  it('requests TikTok creator consent and blocks posting if metadata is invalid', async () => {
    const url = new URL(buildTikTokAuthorizationUrl({ clientKey: 'client', redirectUri: 'https://app.test/callback', state: 'signed' }));
    expect(url.searchParams.get('scope')).toContain('video.publish');
    await expect(uploadYouTubeVideo({ accessToken: 'token', bytes: new Uint8Array(), title: 'Title', description: '', tags: [], visibility: 'public' })).rejects.toThrow(/50 MB/);
  });

  it('persists a resumable session before sending video bytes and returns the YouTube ID', async () => {
    const originalFetch = globalThis.fetch; let storedSession = false;
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      if (init?.method === 'POST') return new Response(null, { status: 200, headers: { location: 'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&upload_id=test' } });
      if (init?.method === 'PUT' && init.headers && new Headers(init.headers).get('Content-Range')?.startsWith('bytes */')) return new Response(null, { status: 308 });
      expect(storedSession).toBe(true);
      return new Response(JSON.stringify({ id: 'video-123' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    });
    vi.stubGlobal('fetch', fetchMock);
    try {
      const result = await uploadYouTubeVideo({ accessToken: 'access', bytes: new Uint8Array([1,2,3]), title: 'Vídeo aprovado', description: '', tags: [], visibility: 'public', onSession: async () => { storedSession = true; } });
      expect(result.id).toBe('video-123');
      expect(fetchMock).toHaveBeenCalledTimes(3);
      const metadata = JSON.parse(String(fetchMock.mock.calls[0][1]?.body)) as { status: { privacyStatus: string } };
      expect(metadata.status.privacyStatus).toBe('public');
    } finally { vi.stubGlobal('fetch', originalFetch); }
  });

  it('keeps scheduled YouTube uploads private until the scheduled time', async () => {
    const originalFetch = globalThis.fetch; const calls: RequestInit[] = [];
    const fetchMock = vi.fn(async (_input: RequestInfo | URL, init?: RequestInit) => {
      calls.push(init ?? {});
      if (init?.method === 'POST') return new Response(null, { status: 200, headers: { location: 'https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&upload_id=test' } });
      if (new Headers(init?.headers).get('Content-Range')?.startsWith('bytes */')) return new Response(null, { status: 308 });
      return new Response(JSON.stringify({ id: 'scheduled-video' }), { status: 200 });
    });
    vi.stubGlobal('fetch', fetchMock);
    try {
      await uploadYouTubeVideo({ accessToken: 'access', bytes: new Uint8Array([1]), title: 'Scheduled title', description: '', tags: [], visibility: 'public', scheduledAt: '2030-01-01T12:00:00.000Z' });
      const metadata = JSON.parse(String(calls[0].body)) as { status: { privacyStatus: string; publishAt: string } };
      expect(metadata.status.privacyStatus).toBe('private');
      expect(metadata.status.publishAt).toBe('2030-01-01T12:00:00.000Z');
    } finally { vi.stubGlobal('fetch', originalFetch); }
  });
});
