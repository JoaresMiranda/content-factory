import { z } from 'zod';
import { oauthPlatformSchema } from '@content-factory/shared';
import { signOAuthState, verifyOAuthState } from '@content-factory/integrations';

export type OAuthPlatform = z.infer<typeof oauthPlatformSchema>;
export type OAuthState = { platform: OAuthPlatform; channelId: string; workspaceId: string; userId: string; exp: number; nonce: string };

const providerConfig = {
  youtube: { clientId: 'YOUTUBE_CLIENT_ID', clientSecret: 'YOUTUBE_CLIENT_SECRET', redirectUri: 'YOUTUBE_REDIRECT_URI' },
  tiktok: { clientId: 'TIKTOK_CLIENT_KEY', clientSecret: 'TIKTOK_CLIENT_SECRET', redirectUri: 'TIKTOK_REDIRECT_URI' },
} as const;

export function parseOAuthPlatform(value: string): OAuthPlatform | null {
  const parsed = oauthPlatformSchema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function getOAuthProviderConfig(platform: OAuthPlatform) {
  const names = providerConfig[platform];
  const clientId = process.env[names.clientId]; const clientSecret = process.env[names.clientSecret]; const redirectUri = process.env[names.redirectUri];
  return clientId && clientSecret && redirectUri ? { clientId, clientSecret, redirectUri } : null;
}

export function getOAuthEncryptionKey() { return process.env.OAUTH_TOKEN_ENCRYPTION_KEY || null; }
export function signState(payload: OAuthState) {
  const secret = process.env.OAUTH_STATE_SECRET;
  if (!secret || secret.length < 32) throw new Error('Configure OAUTH_STATE_SECRET com pelo menos 32 caracteres.');
  return signOAuthState(payload, secret);
}
export function verifyState(token: string): OAuthState {
  const secret = process.env.OAUTH_STATE_SECRET;
  if (!secret || secret.length < 32) throw new Error('Configuração OAuth incompleta.');
  return verifyOAuthState<OAuthState>(token, secret);
}
