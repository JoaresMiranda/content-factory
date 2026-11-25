import { Anchor, BarChart3, BookOpenText, Clapperboard, FileText, FolderOpen, LayoutDashboard, Search, Send, Settings, Radio } from 'lucide-react';
import { signOut } from '@/lib/auth/actions';

const navigation = [
  { label: 'Dashboard', icon: LayoutDashboard, href: '/' },
  { label: 'Canais', icon: Radio, href: '/channels' },
  { label: 'Pesquisa', icon: Search, href: '/research' },
  { label: 'Pesquisa e fontes', icon: Search, href: '/sources' },
  { label: 'Pautas', icon: BookOpenText, href: '/topics' },
  { label: 'Roteiros', icon: FileText, href: '/scripts' },
  { label: 'Produções', icon: Clapperboard, href: '/productions' },
  { label: 'Publicações', icon: Send },
  { label: 'Analytics', icon: BarChart3 },
  { label: 'Biblioteca de mídia', icon: FolderOpen, href: '/media' },
  { label: 'Configurações', icon: Settings },
];

export function Sidebar({ activePath = '/' }: { activePath?: string }) {
  return <aside className="hidden min-h-screen w-64 shrink-0 flex-col border-r border-slate-200 bg-white px-4 py-6 md:flex">
    <div className="mb-9 flex items-center gap-3 px-2">
      <div className="grid size-10 place-items-center rounded-xl bg-cyan-700 text-white"><Anchor size={21} /></div>
      <div><p className="font-bold tracking-tight">Content Factory</p><p className="text-xs text-slate-500">Estúdio de conteúdo</p></div>
    </div>
    <p className="mb-3 px-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Workspace</p>
    <nav className="flex-1 space-y-1">{navigation.map(({ label, icon: Icon, href }) => href ? <a key={label} href={href} aria-current={activePath === href ? 'page' : undefined} className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${activePath === href ? 'bg-cyan-50 font-semibold text-cyan-800' : 'text-slate-600 hover:bg-slate-50'}`}><Icon size={17} strokeWidth={1.8} />{label}</a> : <span key={label} aria-disabled="true" title="Disponível em sprint futura" className="flex cursor-not-allowed items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-400"><Icon size={17} strokeWidth={1.8} />{label}</span>)}</nav>
    <div className="rounded-xl bg-slate-50 p-3"><p className="text-xs font-semibold">Mergulho Curioso</p><p className="mt-1 text-xs text-slate-500">YouTube Shorts · TikTok</p><form action={signOut}><button className="mt-3 text-xs font-medium text-slate-500 hover:text-slate-800">Sair da conta</button></form></div>
  </aside>;
}
