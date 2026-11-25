import { AdminShell } from '@/components/admin';

export function ModuleLoading({ title, activePath }: { title: string; activePath: string }) {
  return <AdminShell title={title} description="Carregando dados do workspace…" activePath={activePath}><div aria-label="Carregando" className="space-y-4"><div className="h-12 animate-pulse rounded-xl bg-slate-200" /><div className="h-64 animate-pulse rounded-2xl bg-white" /></div></AdminShell>;
}
