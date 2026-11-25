import type { ReactNode } from 'react';
import { Sidebar } from './sidebar';
import { signOut } from '@/lib/auth/actions';

export function AdminShell({ title, description, activePath, children, actions }: { title: string; description: string; activePath: string; children: ReactNode; actions?: ReactNode }) {
  return <div className="flex min-h-screen"><Sidebar activePath={activePath} /><main className="min-w-0 flex-1 px-5 py-6 md:px-10 md:py-8">
    <div className="mb-6 flex items-center justify-between md:hidden"><a href="/" className="font-bold">Content Factory</a><form action={signOut}><button className="text-sm font-medium text-slate-500">Sair da conta</button></form></div>
    <header className="mb-7 flex flex-wrap items-start justify-between gap-4"><div><p className="text-sm text-slate-500">Workspace · Mergulho Curioso</p><h1 className="mt-1 text-3xl font-bold tracking-tight">{title}</h1><p className="mt-2 text-sm text-slate-500">{description}</p></div>{actions}</header>{children}
  </main></div>;
}

export function Notice({ error, success }: { error?: string; success?: string }) {
  return <>{error && <p role="alert" className="mb-5 rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">{error}</p>}{success && <p role="status" className="mb-5 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">{success}</p>}</>;
}

export function Field({ label, name, defaultValue = '', required = false, type = 'text', placeholder, maxLength }: { label: string; name: string; defaultValue?: string | null; required?: boolean; type?: string; placeholder?: string; maxLength?: number }) {
  return <label className="block text-sm font-medium text-slate-700">{label}<input name={name} type={type} defaultValue={defaultValue ?? ''} required={required} maxLength={maxLength} placeholder={placeholder} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100" /></label>;
}

export function TextArea({ label, name, defaultValue = '', rows = 4, maxLength }: { label: string; name: string; defaultValue?: string | null; rows?: number; maxLength?: number }) {
  return <label className="block text-sm font-medium text-slate-700">{label}<textarea name={name} defaultValue={defaultValue ?? ''} rows={rows} maxLength={maxLength} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100" /></label>;
}

export function SelectField({ label, name, options, defaultValue, required = false }: { label: string; name: string; options: { value: string; label: string }[]; defaultValue?: string; required?: boolean }) {
  return <label className="block text-sm font-medium text-slate-700">{label}<select name={name} defaultValue={defaultValue ?? ''} required={required} className="mt-1.5 w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 font-normal outline-none focus:border-cyan-700 focus:ring-2 focus:ring-cyan-100"><option value="">Selecione</option>{options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}</select></label>;
}

export function ActiveCheckbox({ defaultChecked = true }: { defaultChecked?: boolean }) {
  return <label className="flex items-center gap-2 text-sm text-slate-700"><input type="checkbox" name="isActive" defaultChecked={defaultChecked} className="size-4 accent-cyan-800" />Ativo</label>;
}

export function SaveButton({ children = 'Salvar' }: { children?: string }) {
  return <button className="rounded-lg bg-cyan-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-cyan-900">{children}</button>;
}
