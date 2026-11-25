'use client';

import { createContext, useContext, useEffect, useState, type FormEvent, type ReactNode } from 'react';

type Voice = { id: string; name: string; category: string; description: string };
type VoiceOptions = { voices: Voice[]; loading: boolean; error: string };
const VoiceOptionsContext = createContext<VoiceOptions>({ voices: [], loading: false, error: '' });

export function NarrationVoiceProvider({ children, enabled }: { children: ReactNode; enabled: boolean }) {
  const [voices, setVoices] = useState<Voice[]>([]);
  const [loading, setLoading] = useState(enabled);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!enabled) return;
    let active = true;
    fetch('/api/voices').then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? 'Não foi possível carregar as vozes.');
      if (active) setVoices(data.voices as Voice[]);
    }).catch((cause: unknown) => {
      if (active) setError(cause instanceof Error ? cause.message : 'Não foi possível carregar as vozes.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [enabled]);
  return <VoiceOptionsContext.Provider value={{ voices, loading, error }}>{children}</VoiceOptionsContext.Provider>;
}

export function NarrationControl({ sceneId, initialVoiceId, initialSpeed, audioUrl, enabled }: { sceneId: string; initialVoiceId: string | null; initialSpeed: number; audioUrl: string | null; enabled: boolean }) {
  const { voices, loading: loadingVoices, error: voiceError } = useContext(VoiceOptionsContext);
  const [voiceId, setVoiceId] = useState(initialVoiceId ?? '');
  const [speed, setSpeed] = useState(initialSpeed);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function generate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!voiceId || !window.confirm('Gerar ou regenerar o áudio pode consumir créditos da sua conta ElevenLabs. Continuar?')) return;
    setBusy(true); setError('');
    try {
      const response = await fetch(`/api/scenes/${sceneId}/voice`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ voiceId, speed }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error ?? 'Não foi possível gerar o áudio.');
      window.location.reload();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível gerar o áudio.');
    } finally {
      setBusy(false);
    }
  }

  return <div className="mt-4 space-y-3 rounded-lg bg-slate-50 p-3">
    <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-600">Narração ElevenLabs</h4>
    {audioUrl ? <audio src={audioUrl} controls preload="metadata" className="w-full" /> : <p className="text-xs text-slate-500">Esta cena ainda não tem áudio gerado.</p>}
    {!enabled ? <p className="text-xs text-amber-800">A narração fica disponível depois que a versão do roteiro for aprovada.</p> : <form onSubmit={generate} className="space-y-2">
      <label className="block text-xs font-medium text-slate-600">Voz<select value={voiceId} onChange={(event) => setVoiceId(event.target.value)} required disabled={loadingVoices || busy} className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-2 py-2 text-sm font-normal"><option value="">{loadingVoices ? 'Carregando vozes…' : 'Selecione uma voz'}</option>{initialVoiceId && !voices.some((voice) => voice.id === initialVoiceId) && <option value={initialVoiceId}>{initialVoiceId} · voz usada anteriormente</option>}{voices.map((voice) => <option key={voice.id} value={voice.id}>{voice.name} · {voice.category}</option>)}</select></label>
      <label className="block text-xs font-medium text-slate-600">Velocidade: {speed.toFixed(2)}×<input type="range" min="0.7" max="1.2" step="0.05" value={speed} onChange={(event) => setSpeed(Number(event.target.value))} disabled={busy} className="mt-1 block w-full accent-cyan-800" /><span className="flex justify-between font-normal text-slate-400"><span>Mais lenta · 0,7×</span><span>Mais rápida · 1,2×</span></span></label>
      <button disabled={busy || loadingVoices || !voices.length} className="w-full rounded-lg bg-cyan-800 px-3 py-2 text-xs font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">{busy ? 'Gerando áudio…' : audioUrl ? 'Regenerar áudio' : 'Gerar áudio'}</button>
    </form>}
    {enabled && <p className="text-xs text-slate-500">O texto desta cena é enviado à ElevenLabs; a retenção segue a configuração padrão da sua conta.</p>}
    {error && <p role="alert" className="text-xs text-rose-700">{error}</p>}
    {voiceError && <p role="status" className="text-xs text-amber-800">{voiceError}</p>}
  </div>;
}
