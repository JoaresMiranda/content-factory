import { AdminShell, Notice } from '@/components/admin';
import { getContentContext } from '@/lib/domains/content';
import { listPublicationData } from '@/lib/domains/publications';
import { PublicationForm } from './publication-form';

const statusLabels: Record<string, string> = { queued: 'Na fila', uploading: 'Enviando', uploaded_private: 'Privado no YouTube', scheduled: 'Agendado', published: 'Publicado', failed: 'Falhou', cancelled: 'Cancelado' };
const badge = (status: string) => status === 'published' ? 'bg-emerald-50 text-emerald-800' : status === 'failed' ? 'bg-rose-50 text-rose-800' : 'bg-amber-50 text-amber-900';

export default async function PublicationsPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const query = await searchParams; const ctx = await getContentContext();
  if ('error' in ctx) return <AdminShell title="Publicações" description="Envie vídeos aprovados para o YouTube e acompanhe o resultado." activePath="/publications"><Notice error={ctx.error} /></AdminShell>;
  const result = await listPublicationData(ctx);
  if ('error' in result) return <AdminShell title="Publicações" description="Envie vídeos aprovados para o YouTube e acompanhe o resultado." activePath="/publications"><Notice error={result.error} /></AdminShell>;
  const youtubeChannels = new Set(result.data.accounts.filter((account) => account.platform === 'youtube' && account.connection_status === 'connected').map(({ channel_id }) => channel_id));
  const candidates = result.data.approvedVideos.filter((video) => youtubeChannels.has(video.channelId));
  return <AdminShell title="Publicações" description="Envie ou agende vídeos aprovados para contas conectadas." activePath="/publications">
    <Notice error={query.error} success={query.success} />
    <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,480px)_minmax(0,1fr)]">
      <div className="space-y-4">{candidates.length ? <PublicationForm videos={candidates} /> : <section className="rounded-2xl border border-slate-200 bg-white p-5"><h2 className="font-semibold">Nenhum vídeo disponível</h2><p className="mt-2 text-sm leading-6 text-slate-600">Conecte uma conta YouTube em Configurações e aprove um vídeo para habilitar o envio.</p><a href="/settings" className="mt-4 inline-flex rounded-lg bg-cyan-800 px-3.5 py-2 text-sm font-semibold text-white">Abrir configurações</a></section>}
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-950"><strong>Publicação pública requer sua ação explícita.</strong> O upload privado não fica visível ao público. Agendar ou publicar agora envia ao YouTube metadados e vídeo de forma irreversível.</section>
      </div>
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold">Histórico de publicações</h2><p className="mt-1 text-xs text-slate-500">Até 100 registros recentes do workspace.</p></div><div className="divide-y divide-slate-100">{result.data.publications.map((publication) => <article key={publication.id} className="flex flex-col justify-between gap-3 p-5 sm:flex-row sm:items-center"><div className="min-w-0"><h3 className="truncate text-sm font-semibold">{publication.title}</h3><p className="mt-1 text-xs text-slate-500">{publication.channelName} · {publication.videoTitle} · {publication.visibility}</p>{publication.scheduled_at && <p className="mt-1 text-xs text-slate-600">Agendado para {new Date(publication.scheduled_at).toLocaleString('pt-BR')}</p>}{publication.last_error && <p className="mt-1 text-xs text-rose-700">{publication.last_error}</p>}</div><div className="flex shrink-0 items-center gap-3"><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${badge(publication.status)}`}>{statusLabels[publication.status] ?? publication.status}</span>{publication.external_url && <a href={publication.external_url} target="_blank" rel="noreferrer" className="text-sm font-medium text-cyan-800 hover:underline">Abrir YouTube</a>}</div></article>)}{!result.data.publications.length && <p className="px-5 py-10 text-center text-sm text-slate-500">Nenhuma publicação solicitada neste workspace.</p>}</div></section>
    </div>
  </AdminShell>;
}
