import { AdminShell, Notice } from '@/components/admin';
import { getOpenAIEnv } from '@/lib/ai/env';
import { getContentContext } from '@/lib/domains/content';
import { listScriptOverview } from '@/lib/domains/scripts';
import { GenerateScriptButton } from './generate-button';

const labels: Record<string, string> = { draft: 'Rascunho', pending_approval: 'Aguardando aprovação', approved: 'Aprovado', rejected: 'Rejeitado' };
const date = (value: string) => new Date(value).toLocaleDateString('pt-BR');

export default async function ScriptsPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const params = await searchParams;
  const ctx = await getContentContext();
  if ('error' in ctx) return <AdminShell title="Roteiros" description="Gere e aprove roteiros por cena." activePath="/scripts"><Notice error={ctx.error} /></AdminShell>;
  const result = await listScriptOverview(ctx);
  if ('error' in result) return <AdminShell title="Roteiros" description="Gere e aprove roteiros por cena." activePath="/scripts"><Notice error={result.error} /></AdminShell>;
  const configured = Boolean(getOpenAIEnv()); const canEdit = ['owner', 'admin', 'editor'].includes(ctx.role);
  return <AdminShell title="Roteiros" description="Gere versões editáveis com cenas e referências; nenhuma versão é aprovada automaticamente." activePath="/scripts">
    <Notice error={params.error} success={params.success} />
    {!configured && <div role="status" className="mb-5 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-950"><strong>OpenAI pendente.</strong> Configure <code>OPENAI_API_KEY</code> no servidor para gerar roteiros.</div>}
    <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold">Roteiros existentes</h2><p className="mt-1 text-xs text-slate-500">Cada edição cria uma nova versão e preserva as anteriores.</p></div><div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-sm"><thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-3">Roteiro / pauta</th><th className="px-5 py-3">Versão</th><th className="px-5 py-3">Status</th><th className="px-5 py-3">Data</th><th className="px-5 py-3">Ação</th></tr></thead><tbody className="divide-y divide-slate-100">{result.data.entries.map((entry) => <tr key={entry.scriptId}><td className="px-5 py-4"><a href={`/scripts/${entry.scriptId}`} className="font-medium text-cyan-900 hover:underline">{entry.title}</a><p className="mt-1 text-xs text-slate-500">{entry.channelName} · {entry.topicTitle}</p></td><td className="px-5 py-4 text-slate-600">v{entry.version_number}</td><td className="px-5 py-4"><span className="rounded-full bg-cyan-50 px-2.5 py-1 text-xs text-cyan-800">{labels[entry.status] ?? entry.status}</span></td><td className="px-5 py-4 text-slate-500">{date(entry.created_at)}</td><td className="px-5 py-4"><a href={`/scripts/${entry.scriptId}`} className="font-medium text-cyan-800">Abrir</a></td></tr>)}</tbody></table></div>{result.data.entries.length === 0 && <p className="px-5 py-8 text-sm text-slate-500">Ainda não há roteiros para as pautas deste workspace.</p>}</section>
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold">Pautas aprovadas sem roteiro</h2><p className="mt-1 text-xs text-slate-500">A geração usa somente as referências registradas na pauta e pode gerar custo de API.</p></div><div className="divide-y divide-slate-100">{result.data.topicsWithoutScript.map((topic) => <div key={topic.id} className="flex flex-col justify-between gap-3 px-5 py-4 sm:flex-row sm:items-center"><div><a href={`/topics/${topic.id}`} className="font-medium text-cyan-900 hover:underline">{topic.title}</a><p className="mt-1 text-xs text-slate-500">{topic.channelName}</p></div><GenerateScriptButton topicId={topic.id} disabled={!configured || !canEdit} /></div>)}</div>{result.data.topicsWithoutScript.length === 0 && <p className="px-5 py-8 text-sm text-slate-500">Todas as pautas aprovadas já têm roteiro, ou ainda não há pautas aprovadas.</p>}</section>
    {!canEdit && <p className="mt-4 text-xs text-slate-500">Seu papel permite consultar roteiros, mas não gerar ou editar versões.</p>}
  </AdminShell>;
}
