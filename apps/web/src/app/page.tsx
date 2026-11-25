import { Activity, CheckCircle2, Clapperboard, Eye, FileCheck2, Lightbulb, Link2, ListVideo, TrendingUp } from 'lucide-react';
import { aggregateLatestMetrics, type AnalyticsSnapshot } from '@content-factory/shared';
import { Sidebar } from '@/components/sidebar';
import { signOut } from '@/lib/auth/actions';
import { createClient } from '@/lib/supabase/server';

function analyticsStartDate() {
  const date = new Date(); date.setUTCDate(date.getUTCDate() - 30);
  return date.toISOString().slice(0, 10);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } = { user: null } } = supabase ? await supabase.auth.getUser() : { data: { user: null } };
  const { data: membership } = supabase && user ? await supabase.from('workspace_members').select('workspace_id').eq('user_id', user.id).order('created_at').limit(1).maybeSingle() : { data: null };
  const workspaceId = membership?.workspace_id;
  const [topics, pending, rendering, published, snapshots, accounts] = supabase && workspaceId ? await Promise.all([
    supabase.from('topics').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId),
    supabase.from('topics').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId).eq('status', 'pending_approval'),
    supabase.from('production_jobs').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId).eq('status', 'rendering'),
    supabase.from('publications').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId).eq('status', 'published'),
    supabase.from('video_metrics').select('publication_id,captured_on,views,likes,comments,shares,watch_time_minutes,average_view_duration_seconds,average_view_percentage,subscribers_gained').eq('workspace_id', workspaceId).gte('captured_on', analyticsStartDate()).order('captured_on', { ascending: true }).limit(5000),
    supabase.from('platform_accounts').select('id', { count: 'exact', head: true }).eq('workspace_id', workspaceId).eq('connection_status', 'connected'),
  ]) : [null, null, null, null, null, null];
  const totals = aggregateLatestMetrics((snapshots?.data ?? []) as AnalyticsSnapshot[]);
  const format = (value: number | null | undefined) => value == null ? '—' : new Intl.NumberFormat('pt-BR', { notation: value > 999_999 ? 'compact' : 'standard', maximumFractionDigits: 1 }).format(value);
  const connected = accounts?.count ?? 0;
  const metrics = [
    { label: 'Pautas encontradas', value: format(topics?.count), detail: workspaceId ? 'Neste workspace' : 'Configure o Supabase', icon: Lightbulb },
    { label: 'Aguardando aprovação', value: format(pending?.count), detail: 'Pautas pendentes de decisão', icon: FileCheck2 },
    { label: 'Vídeos em produção', value: format(rendering?.count), detail: 'Renderizações em andamento', icon: Clapperboard },
    { label: 'Publicações realizadas', value: format(published?.count), detail: 'Publicadas no YouTube', icon: ListVideo },
  ];
  const firstName = user?.user_metadata?.full_name?.split(' ')[0] ?? 'criador';
  return <div className="flex min-h-screen"><Sidebar /><main className="min-w-0 flex-1 px-6 py-8 md:px-10">
    <div className="mb-6 flex items-center justify-between md:hidden"><p className="font-bold tracking-tight">Content Factory</p><form action={signOut}><button className="text-sm font-medium text-slate-500">Sair da conta</button></form></div>
    <header className="mb-8 flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-slate-500">Visão geral do canal</p><h1 className="mt-1 text-3xl font-bold tracking-tight">Bom dia, {firstName}</h1><p className="mt-2 text-sm text-slate-500">Acompanhe sua operação de conteúdo em um só lugar.</p></div><div className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-600">Mergulho Curioso</div></header>
    {!supabase && <div role="status" className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><strong>Supabase pendente.</strong> Configure as variáveis no arquivo .env.local e aplique as migrations para ativar autenticação e dados persistentes.</div>}
    <section aria-label="Indicadores" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metrics.map(({ label, value, detail, icon: Icon }) => <article key={label} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-start justify-between"><span className="text-sm text-slate-500">{label}</span><span className="rounded-lg bg-cyan-50 p-2 text-cyan-800"><Icon size={17} /></span></div><p className="mt-5 text-3xl font-bold">{value}</p><p className="mt-1 text-xs text-slate-400">{detail}</p></article>)}</section>
    <section className="mt-6 grid gap-6 xl:grid-cols-[1.55fr_1fr]">
      <article className="rounded-2xl border border-slate-200 bg-white p-6"><div className="flex items-start justify-between"><div><h2 className="font-semibold">Desempenho do canal</h2><p className="mt-1 text-sm text-slate-500">Snapshots mais recentes dos últimos 30 dias</p></div><span className="rounded-lg bg-slate-50 p-2 text-slate-500"><TrendingUp size={18} /></span></div>{totals.videos ? <div className="mt-8 grid min-h-48 grid-cols-2 content-center gap-4 rounded-xl border border-slate-100 bg-slate-50/50 p-5"><div><p className="text-xs text-slate-500">Visualizações</p><p className="mt-1 text-2xl font-bold">{format(totals.views)}</p></div><div><p className="text-xs text-slate-500">Curtidas</p><p className="mt-1 text-2xl font-bold">{format(totals.likes)}</p></div><div><p className="text-xs text-slate-500">Retenção média</p><p className="mt-1 text-2xl font-bold">{totals.averageViewPercentage === null ? '—' : `${totals.averageViewPercentage.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`}</p></div><a href="/analytics" className="self-end text-sm font-semibold text-cyan-800 hover:underline">Ver Analytics</a></div> : <div className="mt-8 grid min-h-48 place-items-center rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center"><div><Eye className="mx-auto text-slate-300" size={28} /><p className="mt-3 text-sm font-medium text-slate-600">Ainda não há métricas</p><p className="mt-1 max-w-sm text-xs text-slate-400">Conecte o YouTube, conceda o acesso a Analytics e aguarde a coleta diária.</p></div></div>}</article>
      <article className="rounded-2xl border border-slate-200 bg-white p-6"><div className="flex items-start justify-between"><div><h2 className="font-semibold">Próximos passos</h2><p className="mt-1 text-sm text-slate-500">Seu espaço de trabalho está pronto</p></div><Activity size={18} className="text-cyan-700" /></div><div className="mt-5 space-y-4"><div className="flex gap-3"><span className="grid size-8 shrink-0 place-items-center rounded-full bg-cyan-50 text-xs font-bold text-cyan-800">1</span><div><p className="text-sm font-medium">Workspace configurado</p><p className="mt-0.5 text-xs text-slate-500">Mergulho Curioso está vinculado ao workspace.</p></div><CheckCircle2 size={16} className="ml-auto text-cyan-700" /></div><div className="flex gap-3"><span className={`grid size-8 shrink-0 place-items-center rounded-full text-xs font-bold ${connected ? 'bg-cyan-50 text-cyan-800' : 'bg-slate-100 text-slate-500'}`}>2</span><div><p className="text-sm font-medium">Contas de publicação</p><p className="mt-0.5 text-xs text-slate-500">{connected ? `${connected} conta(s) conectada(s)` : 'Conecte o canal em Configurações.'}</p></div><a href="/settings" aria-label="Gerenciar conexões" className="ml-auto self-center"><Link2 size={16} className="text-cyan-700" /></a></div></div></article>
    </section>
    <footer className="mt-8 text-xs text-slate-400">Content Factory · Analytics sincronizados diariamente</footer>
  </main></div>;
}
