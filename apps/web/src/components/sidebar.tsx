import { Anchor, BarChart3, BookOpenText, Clapperboard, FileText, FolderOpen, LayoutDashboard, Search, Send, Settings } from 'lucide-react';
import { signOut } from '@/lib/auth/actions';

const navigation = [
  { label: 'Dashboard', icon: LayoutDashboard },
  { label: 'Pesquisa', icon: Search },
  { label: 'Pautas', icon: BookOpenText },
  { label: 'Roteiros', icon: FileText },
  { label: 'Produções', icon: Clapperboard },
  { label: 'Publicações', icon: Send },
  { label: 'Analytics', icon: BarChart3 },
  { label: 'Biblioteca de mídia', icon: FolderOpen },
  { label: 'Configurações', icon: Settings },
];

export function Sidebar() {
  return <aside className="hidden min-h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 md:flex">
    <div className="mb-9 flex items-center gap-3 px-2">
      <div className="grid size-10 place-items-center rounded-xl bg-cyan-700 text-white"><Anchor size={21} /></div>
      <div><p className="font-bold tracking-tight">Content Factory</p><p className="text-xs text-slate-500">Estúdio de conteúdo</p></div>
    </div>
    <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
    <nav className="flex-1 space-y-1">{navigation.map(({ label, icon: Icon }, index) => index === 0 ? <a key={label} href="/" aria-current="page" className="flex items-center gap-3 rounded-lg bg-cyan-50 px-3 py-2.5 text-sm font-semibold text-cyan-800"><Icon size={17} strokeWidth={1.8} />{label}</a> : <span key={label} aria-disabled="true" title="Disponível em sprint futura" className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400"><Icon size={17} strokeWidth={1.8} />{label}</span>)}</nav>
    <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold">Mergulho Curioso</p><p className="mt-1 text-xs text-slate-500">YouTube Shorts · TikTok</p><form action={signOut}><button className="mt-3 text-xs font-medium text-slate-500 hover:text-slate-800">Sair da conta</button></form></div>
  </aside>;
}
