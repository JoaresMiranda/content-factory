'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { canDecideScript, rejectionReasonSchema, scriptContentSchema, scriptVersionEditSchema } from '@content-factory/shared';
import { getContentContext } from './content';
import { createScriptVersion, decideScriptVersion, loadScript } from './scripts';

const text = (form: FormData, name: string) => String(form.get(name) ?? '');
const fail = (path: string, message: string): never => redirect(`${path}?error=${encodeURIComponent(message)}`);

export async function saveScriptVersionAction(form: FormData) {
  const scriptId = text(form, 'scriptId');
  let content: unknown;
  try { content = JSON.parse(text(form, 'content')); } catch { return fail(`/scripts/${scriptId}/edit`, 'O conteúdo do roteiro está inválido.'); }
  const parsed = scriptVersionEditSchema.safeParse({ scriptId, content });
  if (!parsed.success) return fail(`/scripts/${scriptId}/edit`, parsed.error.issues[0]?.message ?? 'Revise os campos e as cenas.');
  const ctx = await getContentContext(); if ('error' in ctx) return fail(`/scripts/${scriptId}/edit`, ctx.error);
  if (!['owner', 'admin', 'editor'].includes(ctx.role)) return fail(`/scripts/${scriptId}/edit`, 'Seu papel não permite editar roteiros.');
  const current = await loadScript(ctx, parsed.data.scriptId);
  if ('error' in current) return fail('/scripts', current.error ?? 'Roteiro não encontrado.');
  const references = scriptContentSchema.shape.factualReferences.safeParse(current.data.version.factual_references);
  if (!references.success) return fail(`/scripts/${scriptId}`, 'As referências da versão atual estão inválidas; regenere o roteiro a partir da pauta aprovada.');
  const fullContent = scriptContentSchema.safeParse({ ...parsed.data.content, factualReferences: references.data });
  if (!fullContent.success) return fail(`/scripts/${scriptId}/edit`, fullContent.error.issues[0]?.message ?? 'Revise o roteiro.');
  const saved = await createScriptVersion(ctx, { topicId: current.data.script.topic_id, scriptId: current.data.script.id, content: fullContent.data });
  if ('error' in saved) return fail(`/scripts/${scriptId}`, saved.error ?? 'Não foi possível criar a versão.');
  revalidatePath('/scripts'); revalidatePath(`/scripts/${scriptId}`);
  redirect(`/scripts/${scriptId}?version=${saved.data.versionId}&success=${encodeURIComponent(`Versão ${saved.data.versionNumber} salva como rascunho.`)}`);
}

export async function decideScriptVersionAction(form: FormData) {
  const scriptId = text(form, 'scriptId'); const versionId = text(form, 'versionId');
  const decision = text(form, 'decision');
  const ctx = await getContentContext(); if ('error' in ctx) return fail(`/scripts/${scriptId}`, ctx.error);
  if (!['owner', 'admin', 'editor'].includes(ctx.role)) return fail(`/scripts/${scriptId}`, 'Seu papel não permite decidir roteiros.');
  if (decision !== 'pending_approval' && decision !== 'approved' && decision !== 'rejected') return fail(`/scripts/${scriptId}`, 'Decisão inválida.');
  if (decision === 'rejected') {
    const parsedReason = rejectionReasonSchema.safeParse(text(form, 'reason'));
    if (!parsedReason.success) return fail(`/scripts/${scriptId}`, 'Informe um motivo com pelo menos 5 caracteres.');
  }
  const current = await loadScript(ctx, scriptId);
  if ('error' in current || !current.data.isLatest || current.data.version.id !== versionId) return fail(`/scripts/${scriptId}`, 'Apenas a versão mais recente pode mudar de estado.');
  if (!canDecideScript(current.data.version.status, decision)) return fail(`/scripts/${scriptId}`, 'A transição não é válida para o estado atual do roteiro.');
  const result = await decideScriptVersion(ctx, versionId, decision, decision === 'rejected' ? text(form, 'reason') : undefined);
  if ('error' in result) return fail(`/scripts/${scriptId}`, result.error ?? 'Não foi possível registrar a decisão.');
  revalidatePath('/scripts'); revalidatePath(`/scripts/${scriptId}`);
  const message = decision === 'pending_approval' ? 'Roteiro enviado para aprovação.' : decision === 'approved' ? 'Roteiro aprovado.' : 'Roteiro rejeitado.';
  redirect(`/scripts/${scriptId}?success=${encodeURIComponent(message)}`);
}
