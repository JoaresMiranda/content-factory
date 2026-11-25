import { AdminShell, Notice } from '@/components/admin';
import { getContentContext } from '@/lib/domains/content';
import { loadScript } from '@/lib/domains/scripts';
import { scriptContentSchema } from '@content-factory/shared';
import { ScriptEditor } from '../../script-editor';

export default async function EditScriptPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params; const query = await searchParams; const ctx = await getContentContext();
  if ('error' in ctx) return <AdminShell title="Editar roteiro" description="Crie uma nova versão editável." activePath="/scripts"><Notice error={ctx.error} /></AdminShell>;
  const result = await loadScript(ctx, id);
  if ('error' in result) return <AdminShell title="Roteiro não encontrado" description="O roteiro não existe neste workspace." activePath="/scripts"><Notice error={result.error} /><a href="/scripts" className="text-cyan-800">Voltar aos roteiros</a></AdminShell>;
  if (!['owner', 'admin', 'editor'].includes(ctx.role)) return <AdminShell title="Acesso somente leitura" description="Seu papel não permite editar roteiros." activePath="/scripts"><a href={`/scripts/${id}`} className="text-cyan-800">Voltar ao roteiro</a></AdminShell>;
  if (!result.data.isLatest) return <AdminShell title="Versão anterior" description="Uma nova revisão sempre parte da versão mais recente." activePath="/scripts"><p className="text-sm text-slate-600">Abra a versão atual antes de editar.</p><a href={`/scripts/${id}`} className="text-cyan-800">Abrir versão atual</a></AdminShell>;
  const refs = scriptContentSchema.shape.factualReferences.safeParse(result.data.version.factual_references);
  if (!refs.success) return <AdminShell title="Referências inválidas" description="Não é possível editar este roteiro." activePath="/scripts"><Notice error="As referências factuais não passaram pela validação." /><a href={`/scripts/${id}`} className="text-cyan-800">Voltar</a></AdminShell>;
  const initial = { ...result.data.version,
    scenes: result.data.scenes.map((scene) => ({ durationSeconds: scene.duration_seconds, narration: scene.narration, visualDescription: scene.visual_description, imageSearchTerms: scene.image_search_terms })) };
  return <AdminShell title="Editar roteiro" description={`Pauta: ${result.data.topic.title}. Salvar cria a próxima versão como rascunho e mantém o histórico.`} activePath="/scripts"><Notice error={query.error} /><ScriptEditor scriptId={id} initial={{ title: initial.title, hook: initial.hook, development: initial.development, conclusion: initial.conclusion, cta: initial.cta, estimatedDurationSeconds: initial.estimated_duration_seconds, scenes: initial.scenes }} /></AdminShell>;
}
