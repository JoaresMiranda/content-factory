'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function ResearchForm({ channels, disabled }: { channels: { id: string; name: string }[]; disabled?: boolean }) {
  const [channelId, setChannelId] = useState(channels[0]?.id ?? '');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();
  async function start(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setMessage('Pesquisando fontes e classificando achados…');
    try {
      const response = await fetch('/api/research/run', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ channelId }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível iniciar a pesquisa.');
      setMessage(`Pesquisa concluída: ${result.findingsCreated} pauta(s) aguardando aprovação; ${result.duplicatesSkipped} duplicidade(s) ignorada(s).`);
      router.refresh();
    } catch (error) { setMessage(error instanceof Error ? error.message : 'Não foi possível concluir a pesquisa.'); }
    finally { setBusy(false); }
  }
  return <form onSubmit={start} className="flex flex-col gap-3 sm:flex-row sm:items-end">
    <label className="min-w-0 flex-1 text-sm font-medium text-slate-700">Canal<select value={channelId} onChange={(event) => setChannelId(event.target.value)} disabled={disabled || busy} required className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal">{channels.map((channel) => <option key={channel.id} value={channel.id}>{channel.name}</option>)}</select></label>
    <button disabled={disabled || busy || !channelId} className="rounded-lg bg-cyan-800 px-4 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">{busy ? 'Pesquisando…' : 'Pesquisar agora'}</button>
    {message && <p role="status" className="basis-full text-sm text-slate-600">{message}</p>}
  </form>;
}
