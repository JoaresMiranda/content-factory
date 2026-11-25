'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export function GenerateScriptButton({ topicId, disabled, label = 'Gerar roteiro' }: { topicId: string; disabled?: boolean; label?: string }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  async function generate() {
    setBusy(true); setError('');
    try {
      const response = await fetch('/api/scripts/generate', { method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify({ topicId }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Não foi possível gerar o roteiro.');
      router.push(`/scripts/${result.scriptId}?version=${result.versionId}`);
      router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Não foi possível gerar o roteiro.'); }
    finally { setBusy(false); }
  }
  return <div className="space-y-1"><button type="button" onClick={generate} disabled={disabled || busy} className="rounded-lg bg-cyan-800 px-3 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:bg-slate-300">{busy ? 'Gerando…' : label}</button>{error && <p role="alert" className="max-w-xs text-xs text-rose-700">{error}</p>}</div>;
}
