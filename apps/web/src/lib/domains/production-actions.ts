'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { startProductionSchema, videoDecisionSchema } from '@content-factory/shared';
import { getContentContext } from './content';

const text = (form: FormData, key: string) => String(form.get(key) ?? '');
const fail = (path: string, message: string): never => redirect(`${path}?error=${encodeURIComponent(message)}`);

export async function startProductionAction(form: FormData) {
  const parsed = startProductionSchema.safeParse({ scriptVersionId: text(form, 'scriptVersionId') });
  if (!parsed.success) return fail('/productions', 'Versão do roteiro inválida.');
  const ctx = await getContentContext(); if ('error' in ctx) return fail('/productions', ctx.error);
  if (!['owner', 'admin', 'editor'].includes(ctx.role)) return fail('/productions', 'Seu papel não permite iniciar produções.');
  const { data, error } = await ctx.supabase.rpc('start_video_production', { p_script_version_id: parsed.data.scriptVersionId });
  if (error || !data) return fail('/productions', error?.message.includes('Every scene') ? 'Adicione narração e mídia visual a todas as cenas antes de renderizar.' : 'Não foi possível iniciar a produção. Confirme que o roteiro está aprovado e atualizado.');
  revalidatePath('/productions');
  redirect(`/productions?success=${encodeURIComponent('Produção enfileirada. O worker iniciará a renderização em instantes.')}`);
}

export async function decideVideoAction(form: FormData) {
  const videoId = text(form, 'videoId');
  const parsed = videoDecisionSchema.safeParse({ videoId, decision: text(form, 'decision'), reason: text(form, 'reason') });
  if (!parsed.success) return fail(`/productions/${videoId}`, parsed.error.issues[0]?.message ?? 'Revise a decisão.');
  const ctx = await getContentContext(); if ('error' in ctx) return fail(`/productions/${videoId}`, ctx.error);
  if (!['owner', 'admin', 'editor'].includes(ctx.role)) return fail(`/productions/${videoId}`, 'Seu papel não permite revisar vídeos.');
  const { error } = await ctx.supabase.rpc('decide_video', { p_video_id: parsed.data.videoId, p_decision: parsed.data.decision, p_reason: parsed.data.reason || null });
  if (error) return fail(`/productions/${videoId}`, 'A decisão não foi registrada; talvez o vídeo já tenha sido revisado.');
  revalidatePath('/productions'); revalidatePath(`/productions/${videoId}`);
  redirect(`/productions/${videoId}?success=${encodeURIComponent('Revisão do vídeo registrada.')}`);
}
