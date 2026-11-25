'use client';

import type { ReactNode } from 'react';

export function ConfirmActionForm({ action, message, fields, children }: { action: (formData: FormData) => void | Promise<void>; message: string; fields: Record<string, string>; children: ReactNode }) {
  return <form action={action} onSubmit={(event) => { if (!window.confirm(message)) event.preventDefault(); }}>{Object.entries(fields).map(([name, value]) => <input key={name} type="hidden" name={name} value={value} />)}{children}</form>;
}
