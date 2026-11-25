import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { narrationGenerationSchema } from '@content-factory/shared';
import { synthesizeSpeech } from '@content-factory/integrations';
import { getContentContext } from '@/lib/domains/content';
import { getElevenLabsApiKey } from '@/lib/ai/elevenlabs-env';
import { MEDIA_BUCKET } from '@/lib/domains/media';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const ctx = await getContentContext();
  if ('error' in ctx) return NextResponse.json({ error: ctx.error }, { status: 401 });
  if (!['owner', 'admin', 'editor'].includes(ctx.role)) return NextResponse.json({ error: 'Seu papel não permite gerar narração.' }, { status: 403 });
  const apiKey = getElevenLabsApiKey();
  if (!apiKey) return NextResponse.json({ error: 'Configure ELEVENLABS_API_KEY no servidor.' }, { status: 503 });
  const input = narrationGenerationSchema.safeParse(await request.json().catch(() => null));
  if (!input.success) return NextResponse.json({ error: 'Selecione uma voz e uma velocidade entre 0,7 e 1,2.' }, { status: 400 });
  const { id: sceneId } = await params;
  const { data: scene, error: sceneError } = await ctx.supabase.from('script_scenes')
    .select('id,narration,script_version_id,script_id,workspace_id')
    .eq('id', sceneId).eq('workspace_id', ctx.workspaceId).maybeSingle();
  if (sceneError || !scene) return NextResponse.json({ error: 'Cena não encontrada neste workspace.' }, { status: 404 });
  const [{ data: version }, { data: script }] = await Promise.all([
    ctx.supabase.from('script_versions').select('id,status').eq('id', scene.script_version_id).eq('workspace_id', ctx.workspaceId).maybeSingle(),
    ctx.supabase.from('scripts').select('id,channel_id').eq('id', scene.script_id).eq('workspace_id', ctx.workspaceId).maybeSingle(),
  ]);
  if (!version || version.status !== 'approved') return NextResponse.json({ error: 'A narração só pode ser gerada para uma versão de roteiro aprovada.' }, { status: 409 });
  if (!script) return NextResponse.json({ error: 'Roteiro não encontrado neste workspace.' }, { status: 404 });

  const { data: reserved, error: reservationError } = await ctx.supabase.rpc('begin_scene_voice_generation', {
    p_scene_id: scene.id, p_voice_id: input.data.voiceId, p_speed: input.data.speed,
  });
  if (reservationError) return NextResponse.json({ error: 'Não foi possível reservar a geração de áudio.' }, { status: 502 });
  if (!reserved) return NextResponse.json({ error: 'Já existe uma geração de áudio em andamento nesta cena. Aguarde antes de tentar novamente.' }, { status: 409 });
  const releaseReservation = async () => { await ctx.supabase.rpc('cancel_scene_voice_generation', { p_scene_id: scene.id }); };

  let audio: Uint8Array;
  try {
    audio = await synthesizeSpeech(apiKey, input.data.voiceId, scene.narration, input.data.speed);
  } catch (error) {
    await releaseReservation();
    return NextResponse.json({ error: error instanceof Error ? error.message : 'A ElevenLabs não conseguiu gerar o áudio.' }, { status: 502 });
  }

  const storagePath = `${ctx.workspaceId}/${crypto.randomUUID()}-narration.mp3`;
  const { error: uploadError } = await ctx.supabase.storage.from(MEDIA_BUCKET).upload(storagePath, audio, { contentType: 'audio/mpeg', upsert: false });
  if (uploadError) { await releaseReservation(); return NextResponse.json({ error: 'O áudio foi gerado, mas não pôde ser armazenado no Supabase Storage.' }, { status: 502 }); }
  const { data: asset, error: assetError } = await ctx.supabase.from('media_assets').insert({
    workspace_id: ctx.workspaceId, channel_id: script.channel_id, kind: 'audio', storage_path: storagePath,
    file_name: `narração-cena-${sceneId.slice(0, 8)}.mp3`, mime_type: 'audio/mpeg', file_size_bytes: audio.byteLength,
    origin: 'ElevenLabs', source_url: 'https://elevenlabs.io', license_name: 'Termos da ElevenLabs',
    author: 'Voz sintética', attribution: `Gerado com a voz ${input.data.voiceId}.`,
    notes: 'Arquivo de narração criado a partir de uma cena aprovada.', created_by: ctx.user.id,
  }).select('id').single();
  if (assetError || !asset) {
    await ctx.supabase.storage.from(MEDIA_BUCKET).remove([storagePath]);
    await releaseReservation();
    return NextResponse.json({ error: 'Não foi possível salvar os metadados do áudio.' }, { status: 502 });
  }
  const { error: completeError } = await ctx.supabase.rpc('complete_scene_voice_generation', { p_scene_id: scene.id, p_audio_asset_id: asset.id });
  if (completeError) {
    await ctx.supabase.from('media_assets').delete().eq('id', asset.id).eq('workspace_id', ctx.workspaceId);
    await ctx.supabase.storage.from(MEDIA_BUCKET).remove([storagePath]);
    await releaseReservation();
    return NextResponse.json({ error: 'O áudio foi salvo, mas não foi vinculado à cena.' }, { status: 502 });
  }
  const { data: signed, error: signedError } = await ctx.supabase.storage.from(MEDIA_BUCKET).createSignedUrl(storagePath, 3600);
  revalidatePath(`/scripts/${script.id}`); revalidatePath('/media');
  if (signedError || !signed) return NextResponse.json({ ok: true, audioUrl: null });
  return NextResponse.json({ ok: true, audioUrl: signed.signedUrl });
}
