'use server';

import { z } from 'zod';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export async function signIn(formData: FormData) {
  const parsed = credentialsSchema.safeParse({ email: formData.get('email'), password: formData.get('password') });
  if (!parsed.success) redirect('/login?error=invalid');
  const supabase = await createClient();
  if (!supabase) redirect('/login?error=configuration');
  const { error } = await supabase.auth.signInWithPassword(parsed.data);
  if (error) redirect('/login?error=credentials');
  redirect('/');
}

export async function signOut() {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();
  redirect('/login');
}
