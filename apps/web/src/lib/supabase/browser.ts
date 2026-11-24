'use client';

import { createBrowserDatabaseClient } from '@content-factory/database/browser';
import { getSupabasePublicEnv } from './env';

export function createClient() {
  const env = getSupabasePublicEnv();
  if (!env) return null;
  return createBrowserDatabaseClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}
