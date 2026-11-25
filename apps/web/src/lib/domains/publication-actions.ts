'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { youtubePublicationInputSchema } from '@content-factory/shared';
import { getContentContext } from './content';

const fail = (message: string): never => redirect(`/publications?error=${encodeURIComponent(message)}`);

export async function startYouTubePublicationAction(form: FormData) {
  const scheduledAt = String(form.get('scheduledAt') ?? '');
  const parsed = youtubePublicationInputSchema.safeParse({
    videoId: String(form.get('videoId') ?? ''), title: String(form.get('title') ?? ''), description: String(form.get('description') ?? ''),
    hashtags: String(form.get('hashtags') ?? '').split(/[ ,\n]+/).map((tag) => tag.replace(/^#+/, '').trim()).filter(Boolean),
    visibility: String(form.get('visibility') ?? 'private'), ...(scheduledAt ? { scheduledAt } : {}),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Confira os campos de publicação.');
  const ctx = await getContentContext(); if ('error' in ctx) return fail(ctx.error);
  if (!['owner','admin','editor'].includes(ctx.role)) return fail('Seu papel não pode criar publicações.');
  const { data, error } = await ctx.supabase.rpc('start_youtube_publication', {
    p_video_id: parsed.data.videoId, p_title: parsed.data.title, p_description: parsed.data.description,
    p_hashtags: parsed.data.hashtags, p_visibility: parsed.data.visibility, p_scheduled_at: parsed.data.scheduledAt ?? null,
  });
  if (error || !data) return fail(error?.message.includes('Connect a YouTube') ? 'Conecte uma conta YouTube para este canal em Configurações.' : 'Não foi possível enfileirar a publicação. Confirme a aprovação do vídeo e os metadados.');
  revalidatePath('/publications');
  redirect(`/publications?success=${encodeURIComponent(parsed.data.scheduledAt ? 'Upload agendado e processando.' : parsed.data.visibility === 'public' ? 'Publicação pública enfileirada.' : 'Upload privado enfileirado.')}`);
}
