'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { mediaAssetLinkSchema, mediaAssetMetadataSchema } from '@content-factory/shared';
import { getContentContext } from './content';
import { MEDIA_BUCKET } from './media';

const allowedFiles: Record<string, 'image' | 'video'> = {
  'image/jpeg': 'image', 'image/png': 'image', 'image/webp': 'image', 'image/gif': 'image',
  'video/mp4': 'video', 'video/webm': 'video', 'video/quicktime': 'video',
};
const text = (form: FormData, name: string) => String(form.get(name) ?? '');
const fail = (message: string): never => redirect(`/media?error=${encodeURIComponent(message)}`);

export async function registerMediaAssetAction(form: FormData) {
  const fileName = text(form, 'fileName'); const mimeType = text(form, 'mimeType'); const fileSize = Number(text(form, 'fileSize'));
  const storagePath = text(form, 'storagePath');
  if (!fileName || fileName.length > 255 || fileSize < 1 || fileSize > 50 * 1024 * 1024) return fail('Selecione um arquivo de imagem ou vídeo de até 50 MB.');
  const kind = allowedFiles[mimeType];
  if (!kind) return fail('Formato não permitido. Use JPEG, PNG, WebP, GIF, MP4, WebM ou MOV.');
  const parsed = mediaAssetMetadataSchema.safeParse({
    channelId: text(form, 'channelId'), origin: text(form, 'origin'), sourceUrl: text(form, 'sourceUrl'),
    licenseName: text(form, 'licenseName'), author: text(form, 'author'), attribution: text(form, 'attribution'), notes: text(form, 'notes'),
  });
  if (!parsed.success) return fail(parsed.error.issues[0]?.message ?? 'Confira a origem, licença e autoria do arquivo.');
  const ctx = await getContentContext(); if ('error' in ctx) return fail(ctx.error);
  if (!['owner', 'admin', 'editor'].includes(ctx.role)) return fail('Seu papel não permite importar mídia.');
  const { data: channel } = await ctx.supabase.from('channels').select('id').eq('id', parsed.data.channelId).eq('workspace_id', ctx.workspaceId).maybeSingle();
  if (!channel) return fail('Canal não encontrado neste workspace.');
  const prefix = `${ctx.workspaceId}/`;
  if (!storagePath.startsWith(prefix) || !/^[0-9a-f-]{36}-[a-zA-Z0-9._-]+$/i.test(storagePath.slice(prefix.length))) return fail('Caminho de Storage inválido para este workspace.');
  const key = storagePath.slice(prefix.length);
  const { data: objects, error: objectError } = await ctx.supabase.storage.from(MEDIA_BUCKET).list(ctx.workspaceId, { search: key, limit: 100 });
  const object = objects?.find((candidate) => candidate.name === key);
  if (objectError || !object) return fail('O arquivo enviado não foi encontrado no bucket privado deste workspace.');
  const actualMime = object.metadata && typeof object.metadata.mimetype === 'string' ? object.metadata.mimetype : mimeType;
  const actualSize = object.metadata && Number(object.metadata.size) > 0 ? Number(object.metadata.size) : fileSize;
  const actualKind = allowedFiles[actualMime];
  if (!actualKind || actualSize > 50 * 1024 * 1024) return fail('O Storage retornou um formato ou tamanho de arquivo inválido.');

  const { error: insertError } = await ctx.supabase.from('media_assets').insert({
    workspace_id: ctx.workspaceId, channel_id: parsed.data.channelId, kind: actualKind, storage_path: storagePath,
    file_name: fileName, mime_type: actualMime, file_size_bytes: actualSize,
    origin: parsed.data.origin, source_url: parsed.data.sourceUrl || null, license_name: parsed.data.licenseName,
    author: parsed.data.author, attribution: parsed.data.attribution, notes: parsed.data.notes, created_by: ctx.user.id,
  });
  if (insertError) {
    await ctx.supabase.storage.from(MEDIA_BUCKET).remove([storagePath]);
    return fail('O arquivo foi enviado, mas os metadados não puderam ser salvos. Verifique os dados de licença e autoria.');
  }
  revalidatePath('/media');
  redirect('/media?success=Arquivo%20adicionado%20%C3%A0%20biblioteca.');
}

export async function linkMediaAssetAction(form: FormData) {
  const parsed = mediaAssetLinkSchema.safeParse({ mediaAssetId: text(form, 'mediaAssetId'), sceneId: text(form, 'sceneId') });
  if (!parsed.success) return fail('Selecione um asset e uma cena válidos.');
  const ctx = await getContentContext(); if ('error' in ctx) return fail(ctx.error);
  if (!['owner', 'admin', 'editor'].includes(ctx.role)) return fail('Seu papel não permite vincular mídia a cenas.');
  const [{ data: asset }, { data: scene }] = await Promise.all([
    ctx.supabase.from('media_assets').select('id,kind,workspace_id').eq('id', parsed.data.mediaAssetId).eq('workspace_id', ctx.workspaceId).maybeSingle(),
    ctx.supabase.from('script_scenes').select('id,workspace_id').eq('id', parsed.data.sceneId).eq('workspace_id', ctx.workspaceId).maybeSingle(),
  ]);
  if (!asset || !scene || asset.workspace_id !== scene.workspace_id) return fail('O asset ou a cena não pertence a este workspace.');
  if (asset.kind !== 'image' && asset.kind !== 'video') return fail('Áudio não pode ser vinculado como asset visual de cena.');
  const { error } = await ctx.supabase.from('scene_media_assets').upsert({ workspace_id: ctx.workspaceId, script_scene_id: scene.id, media_asset_id: asset.id, linked_by: ctx.user.id }, { onConflict: 'script_scene_id' });
  if (error) return fail('Não foi possível vincular o asset à cena.');
  revalidatePath('/media'); revalidatePath('/scripts');
  redirect('/media?success=M%C3%ADdia%20vinculada%20%C3%A0%20cena.');
}
