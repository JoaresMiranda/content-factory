import { signIn } from '@/lib/auth/actions';
import { getSupabasePublicEnv } from '@/lib/supabase/env';

const messages: Record<string, string> = {
  invalid: 'Informe um e-mail válido e uma senha com pelo menos 8 caracteres.',
  credentials: 'Não foi possível entrar. Confira seu e-mail e senha.',
  configuration: 'O Supabase ainda não está configurado neste ambiente.',
};

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  const configured = Boolean(getSupabasePublicEnv());
  return <main className="grid min-h-screen place-items-center px-5 py-12"><div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm"><div className="mb-7"><p className="text-sm font-semibold text-cyan-800">Content Factory</p><h1 className="mt-2 text-2xl font-bold">Acesse seu workspace</h1><p className="mt-2 text-sm text-slate-500">Entre para continuar no Mergulho Curioso.</p></div>
    {!configured && <p role="status" className="mb-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-900">Configure NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY para habilitar o login.</p>}
    {error && messages[error] && <p role="alert" className="mb-5 rounded-lg bg-rose-50 p-3 text-sm text-rose-800">{messages[error]}</p>}
    <form action={signIn} className="space-y-4"><label className="block text-sm font-medium">E-mail<input name="email" type="email" autoComplete="email" required className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100" /></label><label className="block text-sm font-medium">Senha<input name="password" type="password" autoComplete="current-password" required minLength={8} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100" /></label><button disabled={!configured} className="w-full rounded-lg bg-cyan-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-900 disabled:cursor-not-allowed disabled:opacity-50">Entrar</button></form>
    <p className="mt-5 text-xs leading-relaxed text-slate-400">As contas são gerenciadas pelo Supabase Auth. O cadastro público não está habilitado.</p></div></main>;
}
