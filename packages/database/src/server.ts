import { createServerClient, type CookieOptions } from '@supabase/ssr';
import type { Database } from './types';

export type SupabaseCookie = { name: string; value: string };
export type SupabaseCookieToSet = SupabaseCookie & { options: CookieOptions };
export type SupabaseCookieAdapter = {
  getAll: () => SupabaseCookie[];
  setAll?: (cookies: SupabaseCookieToSet[]) => void;
};

export function createServerDatabaseClient(
  url: string,
  publishableKey: string,
  cookieAdapter: SupabaseCookieAdapter,
) {
  return createServerClient<Database>(url, publishableKey, { cookies: cookieAdapter });
}
