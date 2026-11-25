'use client';

import { useState } from 'react';
import { startYouTubePublicationAction } from '@/lib/domains/publication-actions';

type Candidate = { id: string; channelId: string; title: string; channelName: string; durationSeconds: number };

export function PublicationForm({ videos }: { videos: Candidate[] }) {
  const [videoId, setVideoId] = useState(''); const [schedule, setSchedule] = useState(''); const selected = videos.find((video) => video.id === videoId);
  const input = 'mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100';
  return <form action={startYouTubePublicationAction} onSubmit={(event) => {
    const form = event.currentTarget; const hidden = form.elements.namedItem('scheduledAt') as HTMLInputElement;
    hidden.value = schedule ? new Date(schedule).toISOString() : '';
    if (schedule && !Number.isFinite(new Date(schedule).getTime())) { event.preventDefault(); }
  }} className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5">
    <div><h2 className="font-semibold">Enviar vídeo aprovado</h2><p className="mt-1 text-xs leading-5 text-slate-500">Escolha privacidade ou agende. Apenas o botão de publicação pública envia o vídeo como público.</p></div>
    <label className="block text-sm font-medium">Vídeo<select name="videoId" value={videoId} onChange={(event) => setVideoId(event.target.value)} required className={input}><option value="">Selecione um vídeo aprovado</option>{videos.map((video) => <option key={video.id} value={video.id}>{video.channelName} · {video.title}</option>)}</select></label>
    {selected && <p className="text-xs text-emerald-800">Aprovado · {selected.durationSeconds}s · {selected.channelName}</p>}
    <label className="block text-sm font-medium">Título YouTube<input name="title" defaultValue={selected?.title ?? ''} key={selected?.id ?? 'no-video'} required maxLength={100} className={input} /></label>
    <label className="block text-sm font-medium">Descrição<textarea name="description" rows={4} maxLength={5000} className={input} placeholder="Contexto, fontes ou CTA" /></label>
    <label className="block text-sm font-medium">Hashtags<input name="hashtags" maxLength={1000} className={input} placeholder="oceanos, vidaMarinha, shorts" /><span className="mt-1 block text-xs font-normal text-slate-500">Separe por espaço ou vírgula. Até 30 tags.</span></label>
    <label className="block text-sm font-medium">Agendar publicação (opcional)<input type="datetime-local" value={schedule} onChange={(event) => setSchedule(event.target.value)} className={input} /><input type="hidden" name="scheduledAt" /></label>
    <div className="grid gap-2 sm:grid-cols-2"><button name="visibility" value="private" className="rounded-lg border border-slate-300 px-3 py-2.5 text-sm font-semibold text-slate-800">Enviar como privado</button><button name="visibility" value="public" className="rounded-lg bg-cyan-800 px-3 py-2.5 text-sm font-semibold text-white hover:bg-cyan-900">{schedule ? 'Agendar como público' : 'Publicar agora'}</button></div>
  </form>;
}
