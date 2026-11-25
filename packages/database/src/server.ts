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
  // Supabase-js currently resolves the generated multi-relation schema to `never` in this workspace;
  // domain inputs and decisions are validated with shared Zod schemas, while PostgreSQL RLS remains authoritative.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createServerClient<Database, 'public', any>(url, publishableKey, { cookies: cookieAdapter });
}
