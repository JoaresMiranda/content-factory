import { searchAndClassify } from '@content-factory/ai';
import { isDuplicateTopic } from '@content-factory/shared';
import type { Database } from '@content-factory/database';
import type { SupabaseClient } from '@supabase/supabase-js';

// Keep query compatibility with the wrappers in packages/database, where the SDK currently resolves this schema to `never`.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Client = SupabaseClient<Database, 'public', any>;

export type ResearchExecution = { runId: string; findingsCreated: number; duplicatesSkipped: number; sourcesConsulted: number };

const failureMessage = (error: unknown) => error instanceof Error ? error.message.slice(0, 500) : 'Falha inesperada durante a pesquisa.';

export async function executeResearch(input: {
  supabase: Client;
  workspaceId: string;
  channelId: string;
  startedBy: string | null;
  apiKey: string;
  model: string;
}): Promise<ResearchExecution> {
  const { supabase, workspaceId, channelId, startedBy, apiKey, model } = input;
  const { data: channel, error: channelError } = await supabase.from('channels').select('id,name,niche,language,is_active').eq('id', channelId).eq('workspace_id', workspaceId).maybeSingle();
  if (channelError || !channel || !channel.is_active) throw new Error('Canal não encontrado ou inativo neste workspace.');

  const [{ data: categories, error: categoryError }, { data: sources, error: sourceError }, { data: links, error: linkError }] = await Promise.all([
    supabase.from('categories').select('id,name,description').eq('channel_id', channelId).eq('workspace_id', workspaceId).eq('is_active', true),
    supabase.from('sources').select('id,name,url,type').eq('workspace_id', workspaceId).eq('is_active', true),
    supabase.from('source_categories').select('source_id,category_id').eq('workspace_id', workspaceId),
  ]);
  if (categoryError || sourceError || linkError) throw new Error('Não foi possível carregar fontes e categorias do canal.');
  const sourceCategoryIds = new Map<string, Set<string>>();
  for (const link of links ?? []) sourceCategoryIds.set(link.source_id, new Set([...(sourceCategoryIds.get(link.source_id) ?? []), link.category_id]));
  const activeSources = (sources ?? []).filter((source) => {
    const categoryIds = sourceCategoryIds.get(source.id);
    return !categoryIds?.size || (categories ?? []).some((category) => categoryIds.has(category.id));
  });
  if (!(categories ?? []).length) throw new Error('Cadastre ao menos uma categoria ativa para este canal.');
  if (!activeSources.length) throw new Error('Cadastre ou ative fontes de pesquisa para este canal.');

  const query = `Pesquisa de ${channel.name}: ${channel.niche ?? 'vida marinha'}`;
  const { data: run, error: createRunError } = await supabase.from('research_runs').insert({
    workspace_id: workspaceId, channel_id: channelId, status: 'running', started_by: startedBy, query,
  }).select('id').single();
  if (createRunError || !run) {
    if (createRunError?.code === '23505') throw new Error('Já existe uma pesquisa em andamento para este canal. Aguarde antes de iniciar outra.');
    throw new Error('Não foi possível registrar a pesquisa.');
  }

  try {
    const result = await searchAndClassify({
      apiKey, model, channelName: channel.name, niche: channel.niche ?? '', language: channel.language,
      categories: (categories ?? []).map(({ id, name, description }) => ({ id, name, description })),
      sources: activeSources,
    });
    const { data: existingTopics, error: topicError } = await supabase.from('topics').select('id,title').eq('channel_id', channelId).eq('workspace_id', workspaceId).neq('status', 'archived');
    if (topicError) throw new Error('A pesquisa concluiu, mas não foi possível comparar pautas existentes.');

    const knownTitles = (existingTopics ?? []).map(({ title }) => title);
    const candidates = result.findings.filter((finding) => {
      if (isDuplicateTopic(finding.title, knownTitles)) return false;
      knownTitles.push(finding.title);
      return true;
    });
    let findingsCreated = 0;
    for (const finding of candidates) {
      const { data: topic, error: insertError } = await supabase.from('topics').insert({
        workspace_id: workspaceId, channel_id: channelId, category_id: finding.categoryId,
        title: finding.title, summary: finding.summary, context: finding.context,
        reference_url: finding.evidence[0]?.url ?? null, status: 'pending_approval', created_by: startedBy,
        research_run_id: run.id, classification_score: finding.relevanceScore,
        classification_rationale: finding.rationale, evidence: finding.evidence,
      }).select('id').single();
      if (insertError || !topic) continue;
      const sourceIds = [...new Set(finding.evidence.flatMap(({ url }) => {
        try {
          const host = new URL(url).hostname.toLowerCase().replace(/^www\./, '');
          const source = activeSources.find((item) => {
            const sourceHost = new URL(item.url).hostname.toLowerCase().replace(/^www\./, '');
            return host === sourceHost || host.endsWith(`.${sourceHost}`) || sourceHost.endsWith(`.${host}`);
          });
          return source ? [source.id] : [];
        } catch { return []; }
      }))];
      if (sourceIds.length) {
        const { error: linkInsertError } = await supabase.from('topic_sources').insert(sourceIds.map((source_id) => ({ workspace_id: workspaceId, topic_id: topic.id, source_id })));
        if (linkInsertError) throw new Error('A pauta foi criada, mas não foi possível vincular suas fontes.');
      }
      findingsCreated++;
    }
    const { error: finishError } = await supabase.from('research_runs').update({
      status: 'completed', sources_consulted: result.sourcesConsulted,
      findings_created: findingsCreated, duplicates_skipped: result.findings.length - findingsCreated,
      completed_at: new Date().toISOString(),
    }).eq('id', run.id).eq('workspace_id', workspaceId);
    if (finishError) throw new Error('A pesquisa terminou, mas não foi possível fechar o registro de execução.');
    return { runId: run.id, findingsCreated, duplicatesSkipped: result.findings.length - findingsCreated, sourcesConsulted: result.sourcesConsulted.length };
  } catch (error) {
    await supabase.from('research_runs').update({ status: 'failed', error_summary: failureMessage(error), completed_at: new Date().toISOString() }).eq('id', run.id).eq('workspace_id', workspaceId);
    throw error;
  }
}
