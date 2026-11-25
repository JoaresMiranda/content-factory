import { AdminShell, Notice } from '@/components/admin';
import { getContentContext } from '@/lib/domains/content';
import { disconnectPlatformAccountAction } from '@/lib/domains/platform-actions';
import { getOAuthProviderConfig } from '@/lib/oauth';

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ error?: string; success?: string }> }) {
  const query = await searchParams; const ctx = await getContentContext();
  if ('error' in ctx) return <AdminShell title="Configurações" description="Conecte canais sociais usando OAuth seguro." activePath="/settings"><Notice error={ctx.error} /></AdminShell>;
  const [{ data: channels }, { data: accounts }] = await Promise.all([
    ctx.supabase.from('channels').select('id,name').eq('workspace_id', ctx.workspaceId).order('name'),
    ctx.supabase.from('platform_accounts').select('id,channel_id,platform,display_name,scopes,connection_status,connected_at').eq('workspace_id', ctx.workspaceId).order('platform'),
  ]);
  const canEdit = ['owner','admin','editor'].includes(ctx.role);
  const youtubeReady = Boolean(getOAuthProviderConfig('youtube'));
  const tiktokReady = Boolean(getOAuthProviderConfig('tiktok'));
  const accountByChannel = new Map((accounts ?? []).map((account) => [`${account.channel_id}:${account.platform}`, account]));
  return <AdminShell title="Configurações" description="Conecte e gerencie contas sociais por canal e workspace." activePath="/settings">
    <Notice error={query.error} success={query.success} />
    <div className="space-y-6">
      {(channels ?? []).map((channel) => <section key={channel.id} className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <div className="border-b border-slate-100 px-5 py-4"><h2 className="font-semibold">{channel.name}</h2><p className="mt-1 text-xs text-slate-500">As conexões são isoladas por workspace e canal.</p></div>
        <div className="grid gap-4 p-5 md:grid-cols-2">
          {(['youtube','tiktok'] as const).map((platform) => {
            const account = accountByChannel.get(`${channel.id}:${platform}`); const configured = platform === 'youtube' ? youtubeReady : tiktokReady;
            const label = platform === 'youtube' ? 'YouTube' : 'TikTok';
            const hasPostScope = account?.scopes.includes('video.publish');
            return <article key={platform} className="rounded-xl border border-slate-200 p-4">
              <div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{label}</h3><p className="mt-1 text-xs text-slate-500">{account?.connection_status === 'connected' ? `Conectado como ${account.display_name}` : 'Nenhuma conta conectada'}</p></div><span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${account?.connection_status === 'connected' ? 'bg-emerald-50 text-emerald-800' : configured ? 'bg-amber-50 text-amber-900' : 'bg-slate-100 text-slate-600'}`}>{account?.connection_status === 'connected' ? 'Conectado' : configured ? 'Pronto para conectar' : 'Credenciais pendentes'}</span></div>
              {platform === 'youtube' ? <p className="mt-3 text-xs leading-5 text-slate-600">Escopos restritos a leitura do canal e upload. O sistema agenda como público somente quando você escolhe uma data ou aciona publicação pública.</p> : <p className="mt-3 text-xs leading-5 text-slate-600">A conexão prepara OAuth e permissões do Content Posting API. A publicação direta exige escopo video.publish aprovado e auditoria do aplicativo TikTok; esta sprint não envia posts ao TikTok.</p>}
              {platform === 'tiktok' && account?.connection_status === 'connected' && !hasPostScope && <p role="status" className="mt-2 text-xs font-medium text-amber-800">O escopo video.publish ainda não foi concedido.</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                {canEdit && configured && <a href={`/api/oauth/${platform}/start?channelId=${channel.id}`} className="rounded-lg bg-cyan-800 px-3.5 py-2 text-xs font-semibold text-white hover:bg-cyan-900">{account?.connection_status === 'connected' ? 'Reconectar' : `Conectar ${label}`}</a>}
                {canEdit && account?.connection_status === 'connected' && <form action={disconnectPlatformAccountAction}><input type="hidden" name="accountId" value={account.id} /><button className="rounded-lg border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-700">Desconectar</button></form>}
                {!configured && <p className="self-center text-xs text-slate-500">Configure IDs, segredo e redirect URI no servidor.</p>}
              </div>
            </article>;
          })}
        </div>
      </section>)}
      {!channels?.length && <p className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-500">Crie um canal antes de conectar contas sociais.</p>}
      <section className="rounded-2xl border border-cyan-200 bg-cyan-50 p-5 text-sm leading-6 text-cyan-950"><h2 className="font-semibold">Segurança e publicação</h2><p className="mt-1">Tokens de acesso e renovação são cifrados com AES-256-GCM e ficam inacessíveis às consultas autenticadas do navegador. Uma publicação no YouTube só é enfileirada para vídeo já aprovado e após uma ação explícita do usuário.</p></section>
    </div>
  </AdminShell>;
}
