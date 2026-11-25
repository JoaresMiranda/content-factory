import { AdminShell, ActiveCheckbox, Field, Notice, SaveButton, TextArea } from '@/components/admin';
import { saveSourceAction } from '@/lib/domains/actions';
import { getContentContext, getFormOptions } from '@/lib/domains/content';

const sourceTypes = [
  ['institutional_site', 'Site institucional'], ['scientific_journal', 'Revista científica'], ['university', 'Universidade'],
  ['news_portal', 'Portal de notícias'], ['environmental_organization', 'Organização ambiental'], ['rss_feed', 'Feed RSS'], ['api', 'API'],
];

export async function SourceFormPage({ id, searchParams }: { id?: string; searchParams: Promise<{ error?: string; success?: string }> }) {
  const params = await searchParams; const ctx = await getContentContext();
  if ('error' in ctx) return <AdminShell title="Fontes" description="Gerencie referências de pesquisa." activePath="/sources"><Notice error={ctx.error} /></AdminShell>;
  const options = await getFormOptions(ctx);
  if (id) {
    const { data, error } = await ctx.supabase.from('sources').select('*').eq('id', id).eq('workspace_id', ctx.workspaceId).maybeSingle();
    if (error || !data) return <AdminShell title="Fonte não encontrada" description="A fonte não existe ou não está disponível neste workspace." activePath="/sources"><a href="/sources" className="text-cyan-800">Voltar às fontes</a></AdminShell>;
    const { data: links } = await ctx.supabase.from('source_categories').select('category_id').eq('source_id', id).eq('workspace_id', ctx.workspaceId);
    const selected = new Set((links ?? []).map((item) => item.category_id));
    return <SourceForm id={id} searchParams={params} name={data.name} url={data.url} type={data.type} description={data.description ?? ''} isActive={data.is_active} selected={selected} categories={options.categories} />;
  }
  return <SourceForm searchParams={params} categories={options.categories} />;
}

function SourceForm({ id, searchParams, name = '', url = '', type = 'institutional_site', description = '', isActive = true, selected = new Set<string>(), categories = [] }: { id?: string; searchParams: { error?: string; success?: string }; name?: string; url?: string; type?: string; description?: string; isActive?: boolean; selected?: Set<string>; categories?: { id: string; name: string }[] }) {
  return <AdminShell title={id ? 'Editar fonte' : 'Cadastrar fonte'} description="Fontes são cadastradas manualmente nesta sprint; não há coleta automática." activePath="/sources"><Notice error={searchParams.error} success={searchParams.success} /><form action={saveSourceAction} className="max-w-3xl space-y-5 rounded-2xl border border-slate-200 bg-white p-5 md:p-7">{id && <input type="hidden" name="id" value={id} />}<Field label="Nome da fonte" name="name" defaultValue={name} required maxLength={160} /><Field label="URL" name="url" type="url" defaultValue={url} required placeholder="https://exemplo.org" /><label className="block text-sm font-medium text-slate-700">Tipo de fonte<select name="type" defaultValue={type} required className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal">{sourceTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><TextArea label="Descrição" name="description" defaultValue={description} rows={4} maxLength={2000} /><fieldset><legend className="mb-2 text-sm font-medium text-slate-700">Categorias relacionadas</legend>{categories.length ? <div className="grid gap-2 sm:grid-cols-2">{categories.map((category) => <label key={category.id} className="flex items-center gap-2 rounded-lg border border-slate-200 p-3 text-sm"><input type="checkbox" name="categoryIds" value={category.id} defaultChecked={selected.has(category.id)} className="size-4 accent-cyan-800" />{category.name}</label>)}</div> : <p className="text-sm text-slate-500">Nenhuma categoria ativa cadastrada; a fonte poderá ser vinculada depois.</p>}</fieldset><ActiveCheckbox defaultChecked={isActive} /><div className="flex gap-2"><SaveButton>{id ? 'Atualizar fonte' : 'Cadastrar fonte'}</SaveButton><a href="/sources" className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm">Cancelar</a></div></form></AdminShell>;
}
