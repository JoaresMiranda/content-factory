import type { Database } from '@content-factory/database';
import { canDecideTopic } from '@content-factory/shared';
import type { User } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';

type ContentContextResult = { error: string } | { supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>; user: User; workspaceId: string; role: Database['public']['Enums']['workspace_role'] };

export async function getContentContext(): Promise<ContentContextResult> {
  const supabase = await createClient();
  if (!supabase) return { error: 'Supabase não está configurado.' as const };
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'Sessão expirada. Entre novamente.' as const };
  const { data: memberships, error } = await supabase.from('workspace_members')
    .select('workspace_id, role').eq('user_id', user.id).order('created_at').limit(1);
  if (error || !memberships?.[0]) return { error: 'Nenhum workspace disponível para esta conta.' as const };
  return { supabase, user, workspaceId: memberships[0].workspace_id, role: memberships[0].role };
}

export type ContentContext = Extract<ContentContextResult, { supabase: unknown }>;
type SourceType = Database['public']['Enums']['source_type'];
type TopicStatus = Database['public']['Enums']['topic_status'];

export async function listChannels() {
  const ctx = await getContentContext(); if ('error' in ctx) return ctx;
  const { data, error } = await ctx.supabase.from('channels').select('*').eq('workspace_id', ctx.workspaceId).order('name');
  return error ? { error: 'Não foi possível carregar canais.' } : { data: data ?? [] };
}

export async function saveChannel(ctx: ContentContext, input: { id?: string; name: string; slug: string; description: string; niche: string; language: string; countryCode: string; timezone: string; isActive: boolean; visualPrimaryColor: string }) {
  const values = { name: input.name, slug: input.slug, description: input.description || null, niche: input.niche || null, language: input.language, country_code: input.countryCode.toUpperCase(), timezone: input.timezone, is_active: input.isActive, visual_identity: { primaryColor: input.visualPrimaryColor } };
  const query = input.id
    ? ctx.supabase.from('channels').update(values).eq('id', input.id).eq('workspace_id', ctx.workspaceId)
    : ctx.supabase.from('channels').insert({ ...values, workspace_id: ctx.workspaceId });
  const { error } = await query;
  return error ? { error: 'Não foi possível salvar o canal. Verifique se o nome ou slug já existe.' } : { ok: true };
}

export async function setChannelActive(ctx: ContentContext, id: string, isActive: boolean) {
  const { error } = await ctx.supabase.from('channels').update({ is_active: isActive }).eq('id', id).eq('workspace_id', ctx.workspaceId);
  return error ? { error: 'Não foi possível atualizar o status do canal.' } : { ok: true };
}

export async function listCategories(ctx: ContentContext, channelId?: string) {
  let query = ctx.supabase.from('categories').select('*').eq('workspace_id', ctx.workspaceId).order('name');
  if (channelId) query = query.eq('channel_id', channelId);
  const { data, error } = await query;
  if (error) return { error: 'Não foi possível carregar categorias.' };
  const { data: channels } = await ctx.supabase.from('channels').select('id,name').eq('workspace_id', ctx.workspaceId);
  const names = new Map((channels ?? []).map((channel) => [channel.id, channel.name]));
  return { data: (data ?? []).map((category) => ({ ...category, channels: { name: names.get(category.channel_id) ?? 'Canal' } })) };
}

export async function saveCategory(ctx: ContentContext, input: { id?: string; channelId: string; name: string; slug: string; description: string; isActive: boolean }) {
  const values = { channel_id: input.channelId, name: input.name, slug: input.slug, description: input.description || null, is_active: input.isActive };
  const { error } = input.id
    ? await ctx.supabase.from('categories').update(values).eq('id', input.id).eq('workspace_id', ctx.workspaceId)
    : await ctx.supabase.from('categories').insert({ ...values, workspace_id: ctx.workspaceId });
  return error ? { error: 'Não foi possível salvar a categoria. Confira o canal e se o slug já está em uso.' } : { ok: true };
}

export async function setCategoryActive(ctx: ContentContext, id: string, isActive: boolean) {
  const { error } = await ctx.supabase.from('categories').update({ is_active: isActive }).eq('id', id).eq('workspace_id', ctx.workspaceId);
  return error ? { error: 'Não foi possível atualizar a categoria.' } : { ok: true };
}

export async function listSources(ctx: ContentContext, filters: { search?: string; type?: SourceType; active?: boolean } = {}) {
  let query = ctx.supabase.from('sources').select('*').eq('workspace_id', ctx.workspaceId).order('name');
  if (filters.search?.trim()) query = query.ilike('name', `%${filters.search.trim().replace(/[%_]/g, '')}%`);
  if (filters.type) query = query.eq('type', filters.type);
  if (filters.active !== undefined) query = query.eq('is_active', filters.active);
  const { data, error } = await query;
  if (error) return { error: 'Não foi possível carregar fontes.' };
  const [{ data: links }, { data: categories }] = await Promise.all([
    ctx.supabase.from('source_categories').select('source_id,category_id').eq('workspace_id', ctx.workspaceId),
    ctx.supabase.from('categories').select('id,name').eq('workspace_id', ctx.workspaceId),
  ]);
  const names = new Map((categories ?? []).map((category) => [category.id, { id: category.id, name: category.name }]));
  const bySource = new Map<string, { category_id: string; categories: { id: string; name: string } }[]>();
  for (const link of links ?? []) {
    const category = names.get(link.category_id); if (!category) continue;
    bySource.set(link.source_id, [...(bySource.get(link.source_id) ?? []), { category_id: link.category_id, categories: category }]);
  }
  return { data: (data ?? []).map((source) => ({ ...source, source_categories: bySource.get(source.id) ?? [] })) };
}

export async function saveSource(ctx: ContentContext, input: { id?: string; name: string; url: string; type: SourceType; description: string; categoryIds: string[]; isActive: boolean }) {
  const values = { name: input.name, url: input.url, type: input.type, description: input.description || null, is_active: input.isActive };
  const saved = input.id
    ? await ctx.supabase.from('sources').update(values).eq('id', input.id).eq('workspace_id', ctx.workspaceId).select('id').single()
    : await ctx.supabase.from('sources').insert({ ...values, workspace_id: ctx.workspaceId }).select('id').single();
  if (saved.error) return { error: 'Não foi possível salvar a fonte. Verifique se a URL já foi cadastrada.' };
  const sourceId = saved.data.id;
  const { error: clearError } = await ctx.supabase.from('source_categories').delete().eq('source_id', sourceId).eq('workspace_id', ctx.workspaceId);
  if (clearError) return { error: 'A fonte foi salva, mas não foi possível atualizar suas categorias.' };
  if (input.categoryIds.length) {
    const { error } = await ctx.supabase.from('source_categories').insert(input.categoryIds.map((category_id) => ({ source_id: sourceId, category_id, workspace_id: ctx.workspaceId })));
    if (error) return { error: 'A fonte foi salva, mas algumas categorias não puderam ser vinculadas.' };
  }
  return { ok: true };
}

export async function setSourceActive(ctx: ContentContext, id: string, isActive: boolean) {
  const { error } = await ctx.supabase.from('sources').update({ is_active: isActive }).eq('id', id).eq('workspace_id', ctx.workspaceId);
  return error ? { error: 'Não foi possível atualizar a fonte.' } : { ok: true };
}

export async function listTopics(ctx: ContentContext, filters: { channelId?: string; categoryId?: string; status?: TopicStatus; search?: string } = {}) {
  let query = ctx.supabase.from('topics').select('*').eq('workspace_id', ctx.workspaceId).order('updated_at', { ascending: false });
  if (filters.channelId) query = query.eq('channel_id', filters.channelId);
  if (filters.categoryId) query = query.eq('category_id', filters.categoryId);
  if (filters.status) query = query.eq('status', filters.status);
  if (filters.search?.trim()) query = query.ilike('title', `%${filters.search.trim().replace(/[%_]/g, '')}%`);
  const { data, error } = await query;
  if (error) return { error: 'Não foi possível carregar pautas.' };
  const [{ data: channels }, { data: categories }, { data: links }, { data: sources }] = await Promise.all([
    ctx.supabase.from('channels').select('id,name').eq('workspace_id', ctx.workspaceId),
    ctx.supabase.from('categories').select('id,name').eq('workspace_id', ctx.workspaceId),
    ctx.supabase.from('topic_sources').select('topic_id,source_id').eq('workspace_id', ctx.workspaceId),
    ctx.supabase.from('sources').select('id,name').eq('workspace_id', ctx.workspaceId),
  ]);
  const channelNames = new Map((channels ?? []).map((row) => [row.id, row.name]));
  const categoryNames = new Map((categories ?? []).map((row) => [row.id, row.name]));
  const sourceNames = new Map((sources ?? []).map((row) => [row.id, row.name]));
  const sourceLinks = new Map<string, { source_id: string; sources: { name: string } }[]>();
  for (const link of links ?? []) {
    const name = sourceNames.get(link.source_id); if (name) sourceLinks.set(link.topic_id, [...(sourceLinks.get(link.topic_id) ?? []), { source_id: link.source_id, sources: { name } }]);
  }
  return { data: (data ?? []).map((topic) => ({ ...topic, channels: { name: channelNames.get(topic.channel_id) ?? 'Canal' }, categories: topic.category_id ? { name: categoryNames.get(topic.category_id) ?? 'Categoria' } : null, topic_sources: sourceLinks.get(topic.id) ?? [] })) };
}

export async function saveTopic(ctx: ContentContext, input: { id?: string; channelId: string; categoryId: string; title: string; summary: string; context: string; sourceIds: string[]; referenceUrl: string; originalPublishedAt: string; internalNotes: string; status: TopicStatus }) {
  const values = { channel_id: input.channelId, category_id: input.categoryId || null, title: input.title, summary: input.summary || null, context: input.context || null, reference_url: input.referenceUrl || null, original_published_at: input.originalPublishedAt || null, internal_notes: input.internalNotes || null, status: input.status, rejection_reason: null, decision_by: null, decision_at: null };
  const saved = input.id
    ? await ctx.supabase.from('topics').update(values).eq('id', input.id).eq('workspace_id', ctx.workspaceId).select('id').single()
    : await ctx.supabase.from('topics').insert({ ...values, workspace_id: ctx.workspaceId, created_by: ctx.user.id }).select('id').single();
  if (saved.error) return { error: 'Não foi possível salvar a pauta. Confira o canal, categoria e campos obrigatórios.' };
  const topicId = saved.data.id;
  const { error: clearError } = await ctx.supabase.from('topic_sources').delete().eq('topic_id', topicId).eq('workspace_id', ctx.workspaceId);
  if (clearError) return { error: 'A pauta foi salva, mas não foi possível atualizar as fontes.' };
  if (input.sourceIds.length) {
    const { error } = await ctx.supabase.from('topic_sources').insert(input.sourceIds.map((source_id) => ({ topic_id: topicId, source_id, workspace_id: ctx.workspaceId })));
    if (error) return { error: 'A pauta foi salva, mas algumas fontes não puderam ser vinculadas.' };
  }
  return { ok: true, id: topicId };
}

export async function decideTopic(ctx: ContentContext, id: string, status: 'approved' | 'rejected' | 'archived', reason = '') {
  if (status !== 'archived') {
    const { data: topic, error: readError } = await ctx.supabase.from('topics').select('status').eq('id', id).eq('workspace_id', ctx.workspaceId).maybeSingle();
    if (readError || !topic) return { error: 'Pauta não encontrada neste workspace.' };
    if (!canDecideTopic(topic.status, status)) return { error: 'A pauta precisa estar aguardando aprovação para registrar essa decisão.' };
  }
  const { error } = await ctx.supabase.from('topics').update({ status, rejection_reason: status === 'rejected' ? reason : null, decision_by: ctx.user.id, decision_at: new Date().toISOString() }).eq('id', id).eq('workspace_id', ctx.workspaceId);
  return error ? { error: 'Não foi possível registrar a decisão da pauta.' } : { ok: true };
}

export async function getTopic(ctx: ContentContext, id: string) {
  const { data, error } = await ctx.supabase.from('topics').select('*').eq('id', id).eq('workspace_id', ctx.workspaceId).maybeSingle();
  if (error) return { error: 'Não foi possível carregar a pauta.' };
  if (!data) return { error: 'Pauta não encontrada neste workspace.' };
  const [{ data: channels }, { data: categories }, { data: links }, { data: sources }] = await Promise.all([
    ctx.supabase.from('channels').select('id,name').eq('id', data.channel_id).eq('workspace_id', ctx.workspaceId),
    ctx.supabase.from('categories').select('id,name').eq('id', data.category_id ?? '').eq('workspace_id', ctx.workspaceId),
    ctx.supabase.from('topic_sources').select('source_id').eq('topic_id', data.id).eq('workspace_id', ctx.workspaceId),
    ctx.supabase.from('sources').select('id,name').eq('workspace_id', ctx.workspaceId),
  ]);
  const sourceNames = new Map((sources ?? []).map((row) => [row.id, row.name]));
  return { data: { ...data, channels: { name: channels?.[0]?.name ?? 'Canal' }, categories: categories?.[0] ? { name: categories[0].name } : null, topic_sources: (links ?? []).flatMap((link) => sourceNames.has(link.source_id) ? [{ source_id: link.source_id, sources: { name: sourceNames.get(link.source_id)! } }] : []) } };
}

export async function getFormOptions(ctx: ContentContext) {
  const [channels, categories, sources] = await Promise.all([
    ctx.supabase.from('channels').select('id,name').eq('workspace_id', ctx.workspaceId).eq('is_active', true).order('name'),
    ctx.supabase.from('categories').select('id,name,channel_id').eq('workspace_id', ctx.workspaceId).eq('is_active', true).order('name'),
    ctx.supabase.from('sources').select('id,name').eq('workspace_id', ctx.workspaceId).eq('is_active', true).order('name'),
  ]);
  return { channels: channels.data ?? [], categories: categories.data ?? [], sources: sources.data ?? [] };
}
