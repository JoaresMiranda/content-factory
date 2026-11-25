import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from 'node:crypto';

function encryptionKey(encoded: string) {
  const value = /^[\da-f]{64}$/i.test(encoded) ? Buffer.from(encoded, 'hex') : Buffer.from(encoded, 'base64');
  if (value.byteLength !== 32) throw new Error('OAUTH_TOKEN_ENCRYPTION_KEY deve ter 32 bytes em hexadecimal ou base64.');
  return value;
}

export function encryptOAuthToken(value: string, encodedKey: string) {
  const iv = randomBytes(12); const cipher = createCipheriv('aes-256-gcm', encryptionKey(encodedKey), iv);
  const ciphertext = Buffer.concat([cipher.update(value, 'utf8'), cipher.final()]);
  return `v1.${iv.toString('base64url')}.${cipher.getAuthTag().toString('base64url')}.${ciphertext.toString('base64url')}`;
}

export function decryptOAuthToken(value: string, encodedKey: string) {
  const [version, iv, tag, ciphertext] = value.split('.');
  if (version !== 'v1' || !iv || !tag || !ciphertext) throw new Error('Token OAuth cifrado inválido.');
  const decipher = createDecipheriv('aes-256-gcm', encryptionKey(encodedKey), Buffer.from(iv, 'base64url'));
  decipher.setAuthTag(Buffer.from(tag, 'base64url'));
  return Buffer.concat([decipher.update(Buffer.from(ciphertext, 'base64url')), decipher.final()]).toString('utf8');
}

export function signOAuthState<T extends Record<string, unknown>>(payload: T, secret: string) {
  const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const signature = createHmac('sha256', secret).update(encoded).digest('base64url');
  return `${encoded}.${signature}`;
}

export function verifyOAuthState<T>(token: string, secret: string, nowSeconds = Math.floor(Date.now() / 1000)): T {
  const [encoded, supplied] = token.split('.');
  if (!encoded || !supplied) throw new Error('Estado OAuth ausente ou inválido.');
  const expected = createHmac('sha256', secret).update(encoded).digest();
  const actual = Buffer.from(supplied, 'base64url');
  if (expected.byteLength !== actual.byteLength || !timingSafeEqual(expected, actual)) throw new Error('Estado OAuth inválido.');
  const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8')) as T & { exp?: number };
  if (typeof payload.exp !== 'number' || payload.exp <= nowSeconds) throw new Error('Estado OAuth expirado.');
  return payload;
}

