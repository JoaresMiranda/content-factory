import { createBrowserClient } from '@supabase/ssr';
import type { Database } from './types';

export function createBrowserDatabaseClient(url: string, publishableKey: string) {
  // Keep the browser wrapper aligned with the server wrapper; writes remain server actions protected by RLS.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createBrowserClient<Database, 'public', any>(url, publishableKey);
}
