import { cookies } from 'next/headers';
import { createServerDatabaseClient, type SupabaseCookieToSet } from '@content-factory/database/server';
import { getSupabasePublicEnv } from './env';

export async function createClient() {
  const env = getSupabasePublicEnv();
  if (!env) return null;

  const cookieStore = await cookies();
  return createServerDatabaseClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      getAll() { return cookieStore.getAll(); },
      setAll(cookiesToSet: SupabaseCookieToSet[]) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Server Components cannot write cookies; middleware and Server Actions refresh sessions.
        }
      },
  });
}
