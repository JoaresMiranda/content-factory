'use client';

import { useState, type FormEvent } from 'react';
import { createClient } from '@/lib/supabase/browser';
import { MEDIA_BUCKET } from '@/lib/domains/media';
import { registerMediaAssetAction } from '@/lib/domains/media-actions';

type Channel = { id: string; name: string };
const supportedTypes = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm', 'video/quicktime']);

export function MediaUploadForm({ workspaceId, channels }: { workspaceId: string; channels: Channel[] }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError('');
    const form = event.currentTarget; const data = new FormData(form); const file = data.get('file');
    if (!(file instanceof File) || file.size < 1 || file.size > 50 * 1024 * 1024) { setError('Selecione um arquivo de imagem ou vídeo de até 50 MB.'); return; }
    if (!supportedTypes.has(file.type)) { setError('Formato não permitido. Use JPEG, PNG, WebP, GIF, MP4, WebM ou MOV.'); return; }
    const supabase = createClient();
    if (!supabase) { setError('Supabase não está configurado neste ambiente.'); return; }
    setBusy(true);
    try {
      const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').slice(-180) || 'asset';
      const storagePath = `${workspaceId}/${crypto.randomUUID()}-${safeFileName}`;
      const { error: uploadError } = await supabase.storage.from(MEDIA_BUCKET).upload(storagePath, file, { contentType: file.type, upsert: false });
      if (uploadError) throw new Error('O upload falhou. Confira o espaço disponível e as políticas do Supabase Storage.');
      data.delete('file'); data.set('storagePath', storagePath); data.set('fileName', file.name.slice(0, 255)); data.set('mimeType', file.type); data.set('fileSize', String(file.size));
      await registerMediaAssetAction(data);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível enviar este arquivo.');
    } finally {
      setBusy(false);
    }
  }

  return <form onSubmit={submit} className="mt-4 space-y-3">
    <label className="block text-sm font-medium text-slate-700">Canal<select name="channelId" required className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal">{channels.map((channel) => <option key={channel.id} value={channel.id}>{channel.name}</option>)}</select></label>
    <label className="block text-sm font-medium text-slate-700">Arquivo<input name="file" type="file" accept="image/jpeg,image/png,image/webp,image/gif,video/mp4,video/webm,video/quicktime" required className="mt-1 w-full text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-cyan-50 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-cyan-900" /></label>
    <label className="block text-sm font-medium text-slate-700">Origem / provedor<input name="origin" required maxLength={240} placeholder="Ex.: arquivo próprio, Wikimedia Commons" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label>
    <label className="block text-sm font-medium text-slate-700">URL da origem <span className="font-normal text-slate-400">(opcional)</span><input name="sourceUrl" type="url" placeholder="https://" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label>
    <label className="block text-sm font-medium text-slate-700">Licença<input name="licenseName" required maxLength={240} placeholder="Ex.: CC BY 4.0, licença comercial" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label>
    <label className="block text-sm font-medium text-slate-700">Autoria<input name="author" required maxLength={200} placeholder="Nome do autor ou organização" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label>
    <label className="block text-sm font-medium text-slate-700">Atribuição<input name="attribution" maxLength={1000} placeholder="Texto exigido pela licença" className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label>
    <label className="block text-sm font-medium text-slate-700">Observações<textarea name="notes" maxLength={2000} rows={2} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2.5 font-normal" /></label>
    {error && <p role="alert" className="text-sm text-rose-700">{error}</p>}
    <button disabled={busy || !channels.length} className="w-full rounded-lg bg-cyan-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-900 disabled:cursor-not-allowed disabled:bg-slate-300">{busy ? 'Enviando arquivo…' : 'Enviar para biblioteca'}</button>
  </form>;
}
