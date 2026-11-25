import { AdminShell, Notice } from '@/components/admin';
import Image from 'next/image';
import { getContentContext } from '@/lib/domains/content';
import { listProductions } from '@/lib/domains/productions';
import { startProductionAction } from '@/lib/domains/production-actions';

const jobLabel: Record<string, string> = { queued: 'Na fila', rendering: 'Renderizando', completed: 'Concluído', failed: 'Falhou', cancelled: 'Cancelado' };
const videoLabel: Record<string, string> = { pending_approval: 'Aguardando aprovação', approved: 'Aprovado', rejected: 'Rejeitado', revision_requested: 'Ajustes solicitados' };
const badge = (status: string) => status === 'failed' || status === 'rejected' ? 'bg-rose-50 text-rose-800' : status === 'approved' || status === 'completed' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-900';

export default async function ProductionsPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const params = await searchParams; const ctx = await getContentContext();
  if ('error' in ctx) return <AdminShell title="Produções" description="Renderize e aprove os vídeos do seu workspace." activePath="/productions"><Notice error={ctx.error} /></AdminShell>;
  const result = await listProductions(ctx);
  if ('error' in result) return <AdminShell title="Produções" description="Renderize e aprove os vídeos do seu workspace." activePath="/productions"><Notice error={result.error} /></AdminShell>;
  const canEdit = ['owner', 'admin', 'editor'].includes(ctx.role);
  return <AdminShell title="Produções" description="Acompanhe a fila de renderização, revise o vídeo e registre a decisão editorial." activePath="/productions">
    <Notice error={params.error} success={params.success} />
    <section className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold">Roteiros aprovados prontos para produção</h2><p className="mt-1 text-xs text-slate-500">Cada cena precisa ter narração e um asset visual vinculado. A publicação em redes sociais continua fora desta sprint.</p></div>
      <div className="divide-y divide-slate-100">{result.data.candidates.map((item) => <article key={item.id} className="flex flex-col justify-between gap-4 p-5 md:flex-row md:items-center"><div className="min-w-0"><h3 className="font-medium">{item.title}</h3><p className="mt-1 text-xs text-slate-500">{item.channelName} · {item.topicTitle} · v{item.version_number} · {item.sceneCount} cenas</p>{item.job && <p className="mt-2 text-xs text-slate-600">Status: <span className={`rounded-full px-2 py-1 ${badge(item.job.status)}`}>{jobLabel[item.job.status] ?? item.job.status}</span>{item.job.last_error && <span className="ml-2 text-rose-700">{item.job.last_error}</span>}</p>}</div>
        {canEdit && item.ready && item.job?.status !== 'queued' && item.job?.status !== 'rendering' && item.job?.status !== 'completed' && <form action={startProductionAction}><input type="hidden" name="scriptVersionId" value={item.id} /><button className="shrink-0 rounded-lg bg-cyan-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-900">{item.job?.status === 'failed' ? 'Tentar novamente' : 'Renderizar vídeo'}</button></form>}
        {!item.ready && <span className="shrink-0 text-xs text-amber-800">Assets pendentes</span>}
      </article>)}{result.data.candidates.length === 0 && <p className="px-5 py-8 text-sm text-slate-500">Ainda não há roteiros aprovados para produzir.</p>}</div>
    </section>
    <section className="rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold">Vídeos para revisão</h2><p className="mt-1 text-xs text-slate-500">Vídeos ficam privados e usam links temporários. Aprovar um vídeo não o publica automaticamente.</p></div>
      <div className="grid gap-4 p-5 md:grid-cols-2 xl:grid-cols-3">{result.data.videos.map((video) => <article key={video.id} className="overflow-hidden rounded-xl border border-slate-200"><a href={`/productions/${video.id}`} className="block">{video.thumbnailUrl && <Image src={video.thumbnailUrl} alt="Miniatura do vídeo" width={360} height={640} unoptimized className="aspect-[9/16] max-h-72 w-full bg-slate-950 object-contain" />}</a><div className="space-y-2 p-4"><div className="flex items-start justify-between gap-2"><h3 className="text-sm font-semibold">{video.title}</h3><span className={`shrink-0 rounded-full px-2 py-1 text-[10px] ${badge(video.status)}`}>{videoLabel[video.status] ?? video.status}</span></div><p className="text-xs text-slate-500">v{video.versionNumber} · {video.duration_seconds}s · {(video.file_size_bytes / (1024 * 1024)).toFixed(1)} MB</p><a href={`/productions/${video.id}`} className="inline-block text-sm font-medium text-cyan-800 hover:underline">Abrir revisão</a></div></article>)}{result.data.videos.length === 0 && <p className="py-8 text-sm text-slate-500">Nenhum vídeo renderizado neste workspace.</p>}</div>
    </section>
  </AdminShell>;
}
