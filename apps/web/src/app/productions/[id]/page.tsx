import { notFound } from 'next/navigation';
import { AdminShell, Notice } from '@/components/admin';
import { getContentContext } from '@/lib/domains/content';
import { MEDIA_BUCKET } from '@/lib/domains/media';
import { decideVideoAction } from '@/lib/domains/production-actions';

const labels: Record<string, string> = { pending_approval: 'Aguardando aprovação', approved: 'Aprovado', rejected: 'Rejeitado', revision_requested: 'Ajustes solicitados' };

export default async function ProductionReviewPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; success?: string }> }) {
  const { id } = await params; const query = await searchParams; const ctx = await getContentContext();
  if ('error' in ctx) return <AdminShell title="Revisão de vídeo" description="Visualize o render e registre a decisão editorial." activePath="/productions"><Notice error={ctx.error} /></AdminShell>;
  const { data: video } = await ctx.supabase.from('videos').select('id,status,video_storage_path,thumbnail_storage_path,duration_seconds,file_size_bytes,resolution,frame_rate,decision_reason,script_version_id,created_at').eq('id', id).eq('workspace_id', ctx.workspaceId).maybeSingle();
  if (!video) notFound();
  const [{ data: version }, { data: playback }, { data: thumbnail }] = await Promise.all([
    ctx.supabase.from('script_versions').select('title,version_number').eq('id', video.script_version_id).eq('workspace_id', ctx.workspaceId).maybeSingle(),
    ctx.supabase.storage.from(MEDIA_BUCKET).createSignedUrl(video.video_storage_path, 3600),
    ctx.supabase.storage.from(MEDIA_BUCKET).createSignedUrl(video.thumbnail_storage_path, 3600),
  ]);
  const canReview = ['owner', 'admin', 'editor'].includes(ctx.role) && video.status === 'pending_approval';
  return <AdminShell title="Revisão de vídeo" description="Assista ao render e registre a revisão para este workspace." activePath="/productions">
    <Notice error={query.error} success={query.success} />
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
      <section className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-950"><video src={playback?.signedUrl ?? undefined} poster={thumbnail?.signedUrl ?? undefined} controls preload="metadata" className="mx-auto max-h-[75vh] w-full object-contain" /></section>
      <aside className="h-fit space-y-5 rounded-2xl border border-slate-200 bg-white p-5"><div><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{labels[video.status] ?? video.status}</p><h2 className="mt-2 text-xl font-semibold">{version?.title ?? 'Vídeo'}</h2><p className="mt-1 text-sm text-slate-500">Versão {version?.version_number ?? '—'}</p></div>
        <dl className="grid grid-cols-2 gap-3 text-sm"><div><dt className="text-xs text-slate-500">Duração</dt><dd className="mt-1 font-medium">{video.duration_seconds}s</dd></div><div><dt className="text-xs text-slate-500">Formato</dt><dd className="mt-1 font-medium">{video.resolution} · {video.frame_rate} fps</dd></div><div><dt className="text-xs text-slate-500">Arquivo</dt><dd className="mt-1 font-medium">{(video.file_size_bytes / (1024 * 1024)).toFixed(1)} MB</dd></div></dl>
        {video.decision_reason && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-950">{video.decision_reason}</p>}
        {canReview ? <form action={decideVideoAction} className="space-y-3 border-t border-slate-100 pt-4"><input type="hidden" name="videoId" value={video.id} /><label className="block text-sm font-medium">Comentário (obrigatório para ajustes ou rejeição)<textarea name="reason" rows={3} maxLength={1000} className="mt-1.5 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm" placeholder="Descreva o que precisa mudar" /></label><button name="decision" value="approved" className="w-full rounded-lg bg-cyan-800 px-4 py-2.5 text-sm font-semibold text-white">Aprovar vídeo</button><div className="grid grid-cols-2 gap-2"><button name="decision" value="revision_requested" className="rounded-lg border border-amber-300 px-3 py-2 text-xs font-semibold text-amber-900">Solicitar ajustes</button><button name="decision" value="rejected" className="rounded-lg border border-rose-300 px-3 py-2 text-xs font-semibold text-rose-800">Rejeitar</button></div></form> : <p className="border-t border-slate-100 pt-4 text-xs text-slate-500">Este vídeo não está aguardando decisão ou seu papel permite somente consulta.</p>}
        <a href="/productions" className="inline-block text-sm font-medium text-cyan-800 hover:underline">Voltar para produções</a>
      </aside>
    </div>
  </AdminShell>;
}
