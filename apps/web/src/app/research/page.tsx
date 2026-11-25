import { AdminShell, Notice } from '@/components/admin';
import { getContentContext } from '@/lib/domains/content';
import { getOpenAIEnv } from '@/lib/ai/env';
import { ResearchForm } from './research-form';

const labels: Record<string, string> = { running: 'Em andamento', completed: 'Concluída', failed: 'Falhou' };
const date = (value: string) => new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

export default async function ResearchPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const params = await searchParams;
  const ctx = await getContentContext();
  if ('error' in ctx) return <AdminShell title="Pesquisa" description="Descubra pautas com fontes cadastradas e análise assistida por IA." activePath="/research"><Notice error={ctx.error} /></AdminShell>;
  const [{ data: channels }, { data: runs, error }] = await Promise.all([
    ctx.supabase.from('channels').select('id,name').eq('workspace_id', ctx.workspaceId).eq('is_active', true).order('name'),
    ctx.supabase.from('research_runs').select('*').eq('workspace_id', ctx.workspaceId).order('started_at', { ascending: false }).limit(20),
  ]);
  const configured = Boolean(getOpenAIEnv());
  const canRun = ['owner', 'admin', 'editor'].includes(ctx.role);
  return <AdminShell title="Pesquisa" description="Encontre curiosidades com fontes cadastradas; toda pauta gerada aguarda decisão humana." activePath="/research" actions={<a href="/sources" className="rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm font-semibold">Gerenciar fontes</a>}>
    <Notice error={params.error} success={params.success} />
    {!configured && <div role="status" className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><strong>OpenAI pendente.</strong> Configure <code>OPENAI_API_KEY</code> no servidor para ativar a pesquisa. A chave nunca é enviada ao navegador.</div>}
    {error && <Notice error="Não foi possível carregar o histórico de pesquisas." />}
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 md:p-7"><div className="mb-4"><h2 className="text-lg font-semibold">Executar pesquisa</h2><p className="mt-1 text-sm text-slate-500">Usa fontes e categorias ativas. Resultados repetidos são ignorados e novos achados entram em Pautas como aguardando aprovação.</p></div>
      {channels?.length ? <ResearchForm channels={channels} disabled={!configured || !canRun} /> : <p className="text-sm text-slate-500">Ative um canal antes de pesquisar.</p>}
      {!canRun && <p className="mt-3 text-xs text-slate-500">Seu papel permite consultar o histórico, mas não executar pesquisas.</p>}
    </section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold">Execuções recentes</h2><p className="mt-1 text-xs text-slate-500">Últimas 20 pesquisas do workspace.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[680px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Início</th><th className="px-5 py-3">Canal</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Resultado</th></tr></thead><tbody className="divide-y divide-slate-100">{(runs ?? []).map((run) => <tr key={run.id}><td className="px-5 py-4 text-slate-600">{date(run.started_at)}</td><td className="px-5 py-4 text-slate-600">{channels?.find((channel) => channel.id === run.channel_id)?.name ?? 'Canal'}</td><td className="px-5 py-4"><span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs text-cyan-800">{labels[run.status] ?? run.status}</span>{run.error_summary && <p className="mt-1 max-w-sm text-xs text-rose-700">{run.error_summary}</p>}</td><td className="px-5 py-4 text-slate-600">{run.findings_created} pauta(s) · {run.duplicates_skipped} duplicidade(s) · {Array.isArray(run.sources_consulted) ? run.sources_consulted.length : 0} fonte(s)</td></tr>)}</tbody></table></div>{!runs?.length && <p className="px-5 py-10 text-center text-sm text-slate-500">Nenhuma pesquisa realizada ainda.</p>}</section>
    <p className="mt-4 text-xs text-slate-500">A pontuação mede adequação editorial, não certeza científica. Revise as evidências antes de aprovar. Nenhuma publicação é automática.</p>
  </AdminShell>;
}
