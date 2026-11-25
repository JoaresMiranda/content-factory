import { createClient } from '@supabase/supabase-js';
import type { Database } from '@content-factory/database';
import { getSupabasePublicEnv } from './env';

export function createAdminClient() {
  const env = getSupabasePublicEnv();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!env || !key) return null;
  // The service role is server-only and is used only by the secret-protected scheduled job.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createClient<Database, 'public', any>(env.NEXT_PUBLIC_SUPABASE_URL, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
