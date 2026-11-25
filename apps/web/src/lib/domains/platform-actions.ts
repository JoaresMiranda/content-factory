'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { decryptOAuthToken, revokeGoogleToken, revokeTikTokToken } from '@content-factory/integrations';
import { getContentContext } from './content';
import { createAdminClient } from '@/lib/supabase/admin';
import { getOAuthEncryptionKey, getOAuthProviderConfig } from '@/lib/oauth';

const fail = (message: string): never => redirect(`/settings?error=${encodeURIComponent(message)}`);

export async function disconnectPlatformAccountAction(form: FormData) {
  const accountId = String(form.get('accountId') ?? '');
  const ctx = await getContentContext(); if ('error' in ctx) return fail(ctx.error);
  if (!['owner','admin','editor'].includes(ctx.role)) return fail('Seu papel não pode remover conexões.');
  const admin = createAdminClient(); const key = getOAuthEncryptionKey();
  if (!admin || !key) return fail('O armazenamento seguro de tokens não está configurado no servidor.');
  const { data: account } = await ctx.supabase.from('platform_accounts').select('id,platform,channel_id').eq('id', accountId).eq('workspace_id', ctx.workspaceId).maybeSingle();
  if (!account) return fail('Conexão não encontrada neste workspace.');
  const [{ data: secret }, config] = await Promise.all([
    admin.from('platform_account_secrets').select('access_token_ciphertext').eq('platform_account_id', account.id).maybeSingle(),
    Promise.resolve(getOAuthProviderConfig(account.platform)),
  ]);
  if (secret?.access_token_ciphertext && config) {
    try {
      const token = decryptOAuthToken(secret.access_token_ciphertext, key);
      if (account.platform === 'youtube') await revokeGoogleToken(token);
      else await revokeTikTokToken(token, config.clientId, config.clientSecret);
    } catch { return fail('O provedor não confirmou a revogação; a conexão local foi mantida.'); }
  }
  const { error } = await ctx.supabase.rpc('disconnect_platform_account', { p_account_id: account.id });
  if (error) return fail('Não foi possível remover a conexão deste workspace.');
  revalidatePath('/settings'); revalidatePath('/publications');
  redirect('/settings?success=Conta desconectada e tokens revogados.');
}
