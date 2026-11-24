import { NextResponse, type NextRequest } from 'next/server';
import { createServerDatabaseClient, type SupabaseCookieToSet } from '@content-factory/database/server';
import { getSupabasePublicEnv } from '@/lib/supabase/env';

export async function proxy(request: NextRequest) {
  const env = getSupabasePublicEnv();
  if (!env) return NextResponse.next({ request });

  let response = NextResponse.next({ request });
  const supabase = createServerDatabaseClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet: SupabaseCookieToSet[]) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
  });
  const { data: { user } } = await supabase.auth.getUser();
  if (!user && request.nextUrl.pathname !== '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }
  if (user && request.nextUrl.pathname === '/login') {
    const url = request.nextUrl.clone();
    url.pathname = '/';
    return NextResponse.redirect(url);
  }
  return response;
}

export const config = { matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'] };
