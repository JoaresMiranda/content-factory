import { AdminShell, Notice } from '@/components/admin';
import { getContentContext } from '@/lib/domains/content';
import Image from 'next/image';
import { listMediaAssets, listMediaSceneOptions } from '@/lib/domains/media';
import { linkMediaAssetAction } from '@/lib/domains/media-actions';
import { MediaUploadForm } from './media-upload-form';

const date = (value: string) => new Date(value).toLocaleDateString('pt-BR');
const size = (bytes: number) => bytes < 1024 * 1024 ? `${Math.ceil(bytes / 1024)} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

export default async function MediaLibraryPage({ searchParams }: { searchParams: Promise<{ q?: string; kind?: string; error?: string; success?: string }> }) {
  const params = await searchParams; const ctx = await getContentContext();
  if ('error' in ctx) return <AdminShell title="Biblioteca de mídia" description="Armazene assets com origem, licença e autoria registradas." activePath="/media"><Notice error={ctx.error} /></AdminShell>;
  const canEdit = ['owner', 'admin', 'editor'].includes(ctx.role);
  const kind = ['image', 'video', 'audio'].includes(params.kind ?? '') ? params.kind as 'image' | 'video' | 'audio' : undefined;
  const [result, { data: channels }, sceneOptions] = await Promise.all([
    listMediaAssets(ctx, { q: params.q, kind }),
    ctx.supabase.from('channels').select('id,name').eq('workspace_id', ctx.workspaceId).order('name'),
    listMediaSceneOptions(ctx),
  ]);
  if ('error' in result) return <AdminShell title="Biblioteca de mídia" description="Armazene assets com origem, licença e autoria registradas." activePath="/media"><Notice error={result.error} /></AdminShell>;
  return <AdminShell title="Biblioteca de mídia" description="Importe, pesquise e vincule imagens e vídeos às cenas, registrando a licença e a autoria." activePath="/media">
    <Notice error={params.error} success={params.success} />
    <div className="grid gap-6 xl:grid-cols-[360px_minmax(0,1fr)]">
      <section className="h-fit rounded-2xl border border-slate-200 bg-white p-5">
        <h2 className="font-semibold">Importar imagem ou vídeo</h2>
        <p className="mt-1 text-xs leading-5 text-slate-500">Até 50 MB. Importe somente material com autorização adequada e informe sua licença.</p>
        {!canEdit ? <p className="mt-4 text-sm text-slate-500">Seu papel permite consultar a biblioteca, mas não importar ou vincular assets.</p> : <MediaUploadForm workspaceId={ctx.workspaceId} channels={channels ?? []} />}
      </section>

      <section className="min-w-0">
        <form className="mb-4 flex flex-col gap-2 rounded-2xl border border-slate-200 bg-white p-3 sm:flex-row">
          <input name="q" defaultValue={params.q} placeholder="Buscar por arquivo, origem, autoria ou licença" className="min-w-0 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm" />
          <select name="kind" defaultValue={kind ?? ''} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm"><option value="">Todos os tipos</option><option value="image">Imagens</option><option value="video">Vídeos</option><option value="audio">Áudios</option></select>
          <button className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium">Buscar</button>
        </form>
        <p className="mb-3 text-xs text-slate-500">Mostrando até 200 arquivos deste workspace. Os arquivos ficam em bucket privado.</p>
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {result.data.map((asset) => <article key={asset.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            {asset.signedUrl && asset.kind === 'image' && <Image src={asset.signedUrl} alt={asset.file_name} width={1200} height={800} unoptimized className="h-44 w-full bg-slate-100 object-cover" />}
            {asset.signedUrl && asset.kind === 'video' && <video src={asset.signedUrl} controls preload="metadata" className="h-44 w-full bg-slate-950 object-contain" />}
            {asset.signedUrl && asset.kind === 'audio' && <div className="p-4"><audio src={asset.signedUrl} controls preload="metadata" className="w-full" /></div>}
            <div className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3"><div className="min-w-0"><h3 className="truncate text-sm font-semibold" title={asset.file_name}>{asset.file_name}</h3><p className="mt-1 text-xs text-slate-500">{asset.channelName} · {asset.kind} · {size(asset.file_size_bytes)} · {date(asset.created_at)}</p></div>{asset.linkedScene && <span className="shrink-0 rounded-full bg-cyan-50 px-2 py-1 text-[10px] font-medium text-cyan-900">Cena vinculada</span>}</div>
              <dl className="space-y-1 text-xs"><div><dt className="inline font-semibold">Origem: </dt><dd className="inline">{asset.origin}{asset.source_url && <> · <a href={asset.source_url} target="_blank" rel="noreferrer" className="text-cyan-800 underline">abrir</a></>}</dd></div><div><dt className="inline font-semibold">Licença: </dt><dd className="inline">{asset.license_name}</dd></div><div><dt className="inline font-semibold">Autoria: </dt><dd className="inline">{asset.author}</dd></div>{asset.attribution && <div><dt className="inline font-semibold">Atribuição: </dt><dd className="inline">{asset.attribution}</dd></div>}{asset.linkedScene && <div><dt className="inline font-semibold">Uso: </dt><dd className="inline">{asset.linkedScene}</dd></div>}</dl>
              {asset.kind !== 'audio' && canEdit && <form action={linkMediaAssetAction} className="flex gap-2 border-t border-slate-100 pt-3"><input type="hidden" name="mediaAssetId" value={asset.id} /><select name="sceneId" required defaultValue="" className="min-w-0 flex-1 rounded-lg border border-slate-300 bg-white px-2 py-2 text-xs"><option value="" disabled>Escolha uma cena</option>{sceneOptions.data.map((scene) => <option key={scene.id} value={scene.id}>{scene.label}</option>)}</select><button className="rounded-lg bg-cyan-800 px-3 py-2 text-xs font-semibold text-white">Vincular / substituir</button></form>}
            </div>
          </article>)}
        </div>
        {result.data.length === 0 && <p className="rounded-2xl border border-dashed border-slate-300 bg-white px-5 py-14 text-center text-sm text-slate-500">Nenhum arquivo encontrado. Importe um asset com origem, licença e autoria para começar.</p>}
      </section>
    </div>
  </AdminShell>;
}
