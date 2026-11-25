'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { channelInputSchema, categoryInputSchema, sourceInputSchema, topicInputSchema, rejectionReasonSchema } from '@content-factory/shared';
import { getContentContext, saveChannel, setChannelActive, saveCategory, setCategoryActive, saveSource, setSourceActive, saveTopic, decideTopic } from './content';

const text = (form: FormData, name: string) => String(form.get(name) ?? '');
const checked = (form: FormData, name: string) => ['on', 'true'].includes(String(form.get(name) ?? ''));
const multi = (form: FormData, name: string) => form.getAll(name).map(String).filter(Boolean);
const fail = (path: string, error: string): never => redirect(`${path}?error=${encodeURIComponent(error)}`);
const done = (path: string, message = 'Alterações salvas.'): never => redirect(`${path}?success=${encodeURIComponent(message)}`);

export async function saveChannelAction(form: FormData) {
  const data = { id: text(form, 'id') || undefined, name: text(form, 'name'), slug: text(form, 'slug') || undefined, description: text(form, 'description'), niche: text(form, 'niche'), language: text(form, 'language'), countryCode: text(form, 'countryCode'), timezone: text(form, 'timezone'), isActive: checked(form, 'isActive'), visualPrimaryColor: text(form, 'visualPrimaryColor') || '#087e8b' };
  const parsed = channelInputSchema.safeParse(data); if (!parsed.success) return fail('/channels', parsed.error.issues[0]?.message ?? 'Confira os campos do canal.');
  const ctx = await getContentContext(); if ('error' in ctx) return fail('/channels', ctx.error);
  if (!['owner', 'admin'].includes(ctx.role)) return fail('/channels', 'Seu papel não permite gerenciar canais.');
  const result = await saveChannel(ctx, parsed.data); if ('error' in result) return fail('/channels', result.error ?? 'Não foi possível concluir a operação.');
  revalidatePath('/channels'); revalidatePath('/'); done('/channels', 'Canal salvo.');
}

export async function toggleChannelAction(form: FormData) {
  const ctx = await getContentContext(); if ('error' in ctx) return fail('/channels', ctx.error);
  if (!['owner', 'admin'].includes(ctx.role)) return fail('/channels', 'Seu papel não permite gerenciar canais.');
  const result = await setChannelActive(ctx, text(form, 'id'), checked(form, 'isActive'));
  if ('error' in result) return fail('/channels', result.error ?? 'Não foi possível concluir a operação.'); revalidatePath('/channels'); done('/channels', 'Status do canal atualizado.');
}

export async function saveCategoryAction(form: FormData) {
  const data = { id: text(form, 'id') || undefined, channelId: text(form, 'channelId'), name: text(form, 'name'), description: text(form, 'description'), isActive: checked(form, 'isActive') };
  const parsed = categoryInputSchema.safeParse(data); if (!parsed.success) return fail('/channels', parsed.error.issues[0]?.message ?? 'Confira os campos da categoria.');
  const ctx = await getContentContext(); if ('error' in ctx) return fail('/channels', ctx.error);
  if (!['owner', 'admin'].includes(ctx.role)) return fail('/channels', 'Seu papel não permite gerenciar categorias.');
  const result = await saveCategory(ctx, parsed.data); if ('error' in result) return fail('/channels', result.error ?? 'Não foi possível concluir a operação.');
  revalidatePath('/channels'); done('/channels', 'Categoria salva.');
}

export async function toggleCategoryAction(form: FormData) {
  const ctx = await getContentContext(); if ('error' in ctx) return fail('/channels', ctx.error);
  if (!['owner', 'admin'].includes(ctx.role)) return fail('/channels', 'Seu papel não permite gerenciar categorias.');
  const result = await setCategoryActive(ctx, text(form, 'id'), checked(form, 'isActive'));
  if ('error' in result) return fail('/channels', result.error ?? 'Não foi possível concluir a operação.'); revalidatePath('/channels'); done('/channels', 'Status da categoria atualizado.');
}

export async function saveSourceAction(form: FormData) {
  const parsed = sourceInputSchema.safeParse({ id: text(form, 'id') || undefined, name: text(form, 'name'), url: text(form, 'url'), type: text(form, 'type'), description: text(form, 'description'), categoryIds: multi(form, 'categoryIds'), isActive: checked(form, 'isActive') });
  if (!parsed.success) return fail('/sources', parsed.error.issues[0]?.message ?? 'Confira os campos da fonte.');
  const ctx = await getContentContext(); if ('error' in ctx) return fail('/sources', ctx.error);
  if (!['owner', 'admin', 'editor'].includes(ctx.role)) return fail('/sources', 'Seu papel não permite gerenciar fontes.');
  const result = await saveSource(ctx, parsed.data); if ('error' in result) return fail('/sources', result.error ?? 'Não foi possível concluir a operação.');
  revalidatePath('/sources'); done('/sources', 'Fonte salva.');
}

export async function toggleSourceAction(form: FormData) {
  const ctx = await getContentContext(); if ('error' in ctx) return fail('/sources', ctx.error);
  if (!['owner', 'admin', 'editor'].includes(ctx.role)) return fail('/sources', 'Seu papel não permite gerenciar fontes.');
  const result = await setSourceActive(ctx, text(form, 'id'), checked(form, 'isActive'));
  if ('error' in result) return fail('/sources', result.error ?? 'Não foi possível concluir a operação.'); revalidatePath('/sources'); done('/sources', 'Status da fonte atualizado.');
}

export async function saveTopicAction(form: FormData) {
  const parsed = topicInputSchema.safeParse({ id: text(form, 'id') || undefined, channelId: text(form, 'channelId'), categoryId: text(form, 'categoryId'), title: text(form, 'title'), summary: text(form, 'summary'), context: text(form, 'context'), sourceIds: multi(form, 'sourceIds'), referenceUrl: text(form, 'referenceUrl'), originalPublishedAt: text(form, 'originalPublishedAt'), internalNotes: text(form, 'internalNotes'), status: text(form, 'status') || 'draft' });
  if (!parsed.success) return fail('/topics', parsed.error.issues[0]?.message ?? 'Confira os campos da pauta.');
  const ctx = await getContentContext(); if ('error' in ctx) return fail('/topics', ctx.error);
  if (!['owner', 'admin', 'editor'].includes(ctx.role)) return fail('/topics', 'Seu papel não permite gerenciar pautas.');
  const result = await saveTopic(ctx, { ...parsed.data, categoryId: parsed.data.categoryId || '', referenceUrl: parsed.data.referenceUrl ?? '', originalPublishedAt: parsed.data.originalPublishedAt ?? '' });
  if ('error' in result) return fail('/topics', result.error ?? 'Não foi possível concluir a operação.');
  revalidatePath('/topics'); revalidatePath('/'); done('/topics', 'Pauta salva.');
}

export async function decideTopicAction(form: FormData) {
  const id = text(form, 'id'); const decision = text(form, 'decision');
  const ctx = await getContentContext(); if ('error' in ctx) return fail('/topics', ctx.error);
  if (!['owner', 'admin', 'editor'].includes(ctx.role)) return fail('/topics', 'Seu papel não permite decidir pautas.');
  if (decision === 'rejected') {
    const parsed = rejectionReasonSchema.safeParse(text(form, 'reason')); if (!parsed.success) return fail(`/topics/${id}`, 'Registre um motivo com pelo menos 5 caracteres.');
    const result = await decideTopic(ctx, id, 'rejected', parsed.data); if ('error' in result) return fail(`/topics/${id}`, result.error ?? 'Não foi possível concluir a operação.');
  } else if (decision === 'approved' || decision === 'archived') {
    const result = await decideTopic(ctx, id, decision); if ('error' in result) return fail(`/topics/${id}`, result.error ?? 'Não foi possível concluir a operação.');
  } else fail(`/topics/${id}`, 'Decisão inválida.');
  revalidatePath('/topics'); revalidatePath(`/topics/${id}`); done(`/topics/${id}`, decision === 'approved' ? 'Pauta aprovada.' : decision === 'rejected' ? 'Pauta rejeitada.' : 'Pauta arquivada.');
}
