import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

export function createBrowserDatabaseClient(url: string, publishableKey: string) {
  return createBrowserClient<Database>(url, publishableKey);
}
