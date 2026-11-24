import { Activity, CheckCircle2, Clapperboard, Eye, FileCheck2, Lightbulb, Link2, ListVideo, TrendingUp } from 'lucide-react';
import { Sidebar } from '@/components/sidebar';
import { signOut } from '@/lib/auth/actions';
import { createClient } from '@/lib/supabase/server';

const metrics = [
  { label: 'Pautas encontradas', value: '—', detail: 'Pesquisa disponível em sprint futura', icon: Lightbulb },
  { label: 'Aguardando aprovação', value: '—', detail: 'Pautas ainda não fazem parte desta sprint', icon: FileCheck2 },
  { label: 'Vídeos em produção', value: '—', detail: 'Produção será habilitada em sprint futura', icon: Clapperboard },
  { label: 'Publicações realizadas', value: '—', detail: 'Conecte uma plataforma', icon: ListVideo },
];

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } = { user: null } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? 'criador';
  return <div className="flex min-h-screen"><Sidebar /><main className="min-w-0 flex-1 px-6 py-8 md:px-10">
    <div className="mb-6 flex items-center justify-between md:hidden"><p className="font-bold tracking-tight">Content Factory</p><form action={signOut}><button className="text-sm font-medium text-slate-500">Sair da conta</button></form></div>
    <header className="mb-8 flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-slate-500">Visão geral do canal</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Bom dia, {firstName}</h1><p className="mt-2 text-sm text-slate-500">Acompanhe sua operação de conteúdo em um só lugar.</p></div><div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600">Mergulho Curioso</div></header>
    {!supabase && <div role="status" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>Supabase pendente.</strong> Configure as variáveis no arquivo .env.local e aplique as migrations para ativar autenticação e dados persistentes.</div>}
    <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(({ label, value, detail, icon: Icon }) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between"><span className="text-sm text-slate-500">{label}</span><span className="rounded-lg bg-cyan-50 p-2 text-cyan-800"><Icon size={17} /></span></div><p className="mt-5 text-3xl font-bold">{value}</p><p className="mt-1 text-xs text-slate-400">{detail}</p></article>)}</section>
    <section className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
      <article className="rounded-2xl border border-slate-200 bg-white p-6"><div className="flex items-start justify-between"><div><h2 className="font-semibold">Desempenho do canal</h2><p className="mt-1 text-sm text-slate-500">Resumo das publicações recentes</p></div><span className="rounded-lg bg-slate-50 p-2 text-slate-500"><TrendingUp size={18} /></span></div><div className="mt-8 grid min-h-48 place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center"><div><Eye className="mx-auto text-slate-300" size={28} /><p className="mt-3 text-sm font-medium text-slate-600">Ainda não há métricas</p><p className="mt-1 max-w-sm text-xs text-slate-400">Conecte uma conta e publique vídeos para acompanhar visualizações e retenção.</p></div></div></article>
      <article className="rounded-2xl border border-slate-200 bg-white p-6"><div className="flex items-start justify-between"><div><h2 className="font-semibold">Próximos passos</h2><p className="mt-1 text-sm text-slate-500">Seu espaço de trabalho está pronto</p></div><Activity size={18} className="text-cyan-700" /></div><div className="mt-5 space-y-4"><div className="flex gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-cyan-50 text-xs font-bold text-cyan-800">1</span><div><p className="text-sm font-medium">Workspace configurado</p><p className="mt-0.5 text-xs text-slate-500">Mergulho Curioso está vinculado ao workspace.</p></div><CheckCircle2 size={16} className="ml-auto text-cyan-700" /></div><div className="flex gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-slate-100 text-xs font-bold text-slate-500">2</span><div><p className="text-sm font-medium">Conectar uma conta de publicação</p><p className="mt-0.5 text-xs text-slate-500">Integrações serão habilitadas em sprint futura.</p></div><Link2 size={16} className="ml-auto text-slate-300" /></div></div></article>
    </section>
    <footer className="mt-8 text-xs text-slate-400">Content Factory · Fundação do workspace</footer>
  </main></div>;
}
