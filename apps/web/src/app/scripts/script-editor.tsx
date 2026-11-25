'use client';

import { useState } from 'react';
import type { ScriptContent } from '@content-factory/shared';
import { saveScriptVersionAction } from '@/lib/domains/script-actions';

type EditableContent = Omit<ScriptContent, 'factualReferences'>;

export function ScriptEditor({ scriptId, initial }: { scriptId: string; initial: EditableContent }) {
  const [content, setContent] = useState(initial);
  const updateScene = (index: number, key: keyof EditableContent['scenes'][number], value: string | number | string[]) => setContent((old) => ({
    ...old, scenes: old.scenes.map((scene, sceneIndex) => sceneIndex === index ? { ...scene, [key]: value } : scene),
  }));
  const inputClass = 'mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100';
  return <form action={saveScriptVersionAction} className="space-y-5">
    <input type="hidden" name="scriptId" value={scriptId} />
    <input type="hidden" name="content" value={JSON.stringify(content)} />
    <div className="grid gap-4 rounded-2xl border border-slate-200 bg-white p-5 md:grid-cols-2 md:p-7">
      <label className="block text-sm font-medium">Título<input className={inputClass} maxLength={120} value={content.title} onChange={(e) => setContent({ ...content, title: e.target.value })} required /></label>
      <label className="block text-sm font-medium">Gancho inicial<textarea className={inputClass} rows={2} maxLength={500} value={content.hook} onChange={(e) => setContent({ ...content, hook: e.target.value })} required /></label>
      <label className="block text-sm font-medium md:col-span-2">Desenvolvimento<textarea className={inputClass} rows={5} maxLength={4000} value={content.development} onChange={(e) => setContent({ ...content, development: e.target.value })} required /></label>
      <label className="block text-sm font-medium">Conclusão<textarea className={inputClass} rows={3} maxLength={800} value={content.conclusion} onChange={(e) => setContent({ ...content, conclusion: e.target.value })} required /></label>
      <label className="block text-sm font-medium">CTA<textarea className={inputClass} rows={3} maxLength={300} value={content.cta} onChange={(e) => setContent({ ...content, cta: e.target.value })} required /></label>
      <label className="block text-sm font-medium">Duração total estimada (segundos)<input className={inputClass} type="number" min={15} max={180} value={content.estimatedDurationSeconds} onChange={(e) => setContent({ ...content, estimatedDurationSeconds: Number(e.target.value) })} required /></label>
    </div>
    <section className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 md:p-7"><div className="flex items-center justify-between gap-3"><div><h2 className="font-semibold">Cenas e narração</h2><p className="mt-1 text-xs text-slate-500">3 a 12 cenas; cada alteração salva uma nova versão.</p></div><button type="button" disabled={content.scenes.length >= 12} onClick={() => setContent({ ...content, scenes: [...content.scenes, { durationSeconds: 5, narration: '', visualDescription: '', imageSearchTerms: ['vida marinha'] }] })} className="rounded-lg border border-slate-300 px-3 py-2 text-sm disabled:opacity-50">Adicionar cena</button></div>
      {content.scenes.map((scene, index) => <fieldset key={index} className="grid gap-3 rounded-xl border border-slate-200 p-4 md:grid-cols-2"><legend className="px-1 text-sm font-semibold">Cena {index + 1}</legend><label className="text-sm">Duração (s)<input type="number" min={2} max={30} className={inputClass} value={scene.durationSeconds} onChange={(e) => updateScene(index, 'durationSeconds', Number(e.target.value))} /></label><label className="text-sm">Termos para pesquisa de imagens<input className={inputClass} value={scene.imageSearchTerms.join(', ')} onChange={(e) => updateScene(index, 'imageSearchTerms', e.target.value.split(',').map((term) => term.trim()).filter(Boolean))} /></label><label className="text-sm md:col-span-2">Narração<textarea className={inputClass} rows={3} maxLength={1000} value={scene.narration} onChange={(e) => updateScene(index, 'narration', e.target.value)} /></label><label className="text-sm md:col-span-2">Descrição visual<textarea className={inputClass} rows={3} maxLength={1200} value={scene.visualDescription} onChange={(e) => updateScene(index, 'visualDescription', e.target.value)} /></label><button type="button" disabled={content.scenes.length <= 3} onClick={() => setContent({ ...content, scenes: content.scenes.filter((_, sceneIndex) => sceneIndex !== index) })} className="justify-self-start text-xs font-medium text-rose-700 disabled:opacity-40">Remover cena</button></fieldset>)}
    </section>
    <div className="flex flex-wrap gap-2"><button className="rounded-lg bg-cyan-800 px-4 py-2.5 text-sm font-semibold text-white">Salvar nova versão como rascunho</button><a href={`/scripts/${scriptId}`} className="rounded-lg border border-slate-300 px-4 py-2.5 text-sm">Cancelar</a></div>
  </form>;
}
