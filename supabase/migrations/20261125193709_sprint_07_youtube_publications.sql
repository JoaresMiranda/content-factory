create type public.platform_name as enum ('youtube', 'tiktok');
create type public.publication_status as enum ('queued', 'uploading', 'uploaded_private', 'scheduled', 'published', 'failed', 'cancelled');

create table public.platform_accounts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  channel_id uuid not null,
  platform public.platform_name not null,
  external_account_id text not null,
  display_name text not null,
  scopes text[] not null default '{}',
  connection_status text not null default 'connected' check (connection_status in ('connected','reauthorization_required','disconnected')),
  connected_by uuid references public.profiles(id) on delete set null,
  connected_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id),
  unique (id, workspace_id, channel_id),
  unique (channel_id, platform),
  foreign key (channel_id, workspace_id) references public.channels(id, workspace_id) on delete cascade
);

create table public.platform_account_secrets (
  platform_account_id uuid primary key,
  workspace_id uuid not null,
  access_token_ciphertext text not null,
  refresh_token_ciphertext text,
  access_token_expires_at timestamptz not null,
  refresh_token_expires_at timestamptz,
  updated_at timestamptz not null default now(),
  foreign key (platform_account_id, workspace_id) references public.platform_accounts(id, workspace_id) on delete cascade
);

create table public.publications (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  channel_id uuid not null,
  video_id uuid not null,
  platform_account_id uuid not null,
  platform public.platform_name not null default 'youtube' check (platform = 'youtube'),
  status public.publication_status not null default 'queued',
  title text not null check (length(trim(title)) between 1 and 100),
  description text not null default '' check (length(description) <= 5000),
  hashtags text[] not null default '{}',
  visibility text not null check (visibility in ('private','public')),
  scheduled_at timestamptz,
  attempts smallint not null default 0 check (attempts between 0 and 3),
  queue_message_id bigint,
  external_id text,
  external_url text,
  last_error text,
  requested_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  uploaded_at timestamptz,
  unique (id, workspace_id),
  foreign key (channel_id, workspace_id) references public.channels(id, workspace_id) on delete cascade,
  foreign key (video_id, workspace_id) references public.videos(id, workspace_id) on delete cascade,
  foreign key (platform_account_id, workspace_id, channel_id) references public.platform_accounts(id, workspace_id, channel_id) on delete cascade,
  check (scheduled_at is null or (visibility = 'public' and scheduled_at > created_at)),
  check (external_url is null or external_url ~ '^https://(www[.]?)?youtube[.]com/')
);

create unique index publications_one_pending_per_video_account_idx on public.publications(video_id, platform_account_id)
  where status in ('queued','uploading','scheduled');
create index platform_accounts_workspace_channel_idx on public.platform_accounts(workspace_id, channel_id);
create index publications_workspace_created_idx on public.publications(workspace_id, created_at desc);

alter table public.platform_accounts enable row level security;
alter table public.platform_account_secrets enable row level security;
alter table public.publications enable row level security;
create policy "Workspace members read platform connections" on public.platform_accounts for select to authenticated
  using (private.is_workspace_member(workspace_id));
create policy "Workspace members read publications" on public.publications for select to authenticated
  using (private.is_workspace_member(workspace_id));
revoke all on public.platform_account_secrets from public, anon, authenticated;
grant select on public.platform_accounts, public.publications to authenticated;
grant all on public.platform_accounts, public.platform_account_secrets, public.publications to service_role;
grant usage on type public.platform_name, public.publication_status to authenticated;

create or replace function public.start_youtube_publication(
  p_video_id uuid, p_title text, p_description text default '', p_hashtags text[] default '{}', p_visibility text default 'private', p_scheduled_at timestamptz default null
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_video public.videos%rowtype; v_account public.platform_accounts%rowtype; v_publication_id uuid; v_message_id bigint;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_visibility not in ('private','public') or length(trim(coalesce(p_title,''))) not between 1 and 100
    or length(coalesce(p_description,'')) > 5000 or cardinality(coalesce(p_hashtags,'{}')) > 30
    or exists (select 1 from unnest(coalesce(p_hashtags,'{}')) hashtag where length(trim(hashtag)) not between 1 and 50) then
    raise exception 'Invalid YouTube publication metadata';
  end if;
  if p_scheduled_at is not null and (p_visibility <> 'public' or p_scheduled_at < now() + interval '5 minutes') then
    raise exception 'A scheduled public post must be at least five minutes in the future';
  end if;
  select * into v_video from public.videos where id = p_video_id for update;
  if not found or v_video.status <> 'approved'
    or not private.has_workspace_role(v_video.workspace_id, array['owner','admin','editor']::public.workspace_role[]) then
    raise exception 'Only an approved video in an editable workspace can be published';
  end if;
  select * into v_account from public.platform_accounts where workspace_id = v_video.workspace_id and channel_id = v_video.channel_id
    and platform = 'youtube' and connection_status = 'connected' for update;
  if not found then raise exception 'Connect a YouTube account for this channel first'; end if;
  perform pg_advisory_xact_lock(hashtextextended(v_video.id::text || ':' || v_account.id::text, 0));
  select id into v_publication_id from public.publications where video_id = v_video.id and platform_account_id = v_account.id
    and status in ('queued','uploading','scheduled') limit 1;
  if v_publication_id is not null then return v_publication_id; end if;
  insert into public.publications (workspace_id, channel_id, video_id, platform_account_id, title, description, hashtags, visibility, scheduled_at, requested_by)
    values (v_video.workspace_id, v_video.channel_id, v_video.id, v_account.id, trim(p_title), coalesce(p_description,''), coalesce(p_hashtags,'{}'), p_visibility, p_scheduled_at, auth.uid())
    returning id into v_publication_id;
  select pgmq.send('publish_jobs', jsonb_build_object('publicationId', v_publication_id, 'workspaceId', v_video.workspace_id)) into v_message_id;
  update public.publications set queue_message_id = v_message_id where id = v_publication_id;
  return v_publication_id;
end;
$$;

create or replace function public.claim_publication(p_visibility_seconds integer default 900)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_msg record; v_publication_id uuid; v_workspace_id uuid;
begin
  select * into v_msg from pgmq.read('publish_jobs', greatest(60, least(p_visibility_seconds, 3600)), 1);
  if not found then return null; end if;
  v_publication_id := (v_msg.message->>'publicationId')::uuid;
  v_workspace_id := (v_msg.message->>'workspaceId')::uuid;
  update public.publications set status = 'uploading', attempts = least(v_msg.read_ct,3), last_error = null
    where id = v_publication_id and workspace_id = v_workspace_id and status in ('queued','uploading');
  if not found then perform pgmq.archive('publish_jobs', v_msg.msg_id); return null; end if;
  if v_msg.read_ct > 3 then
    update public.publications set status = 'failed', last_error = 'Limite de tentativas excedido.' where id = v_publication_id;
    perform pgmq.archive('publish_jobs', v_msg.msg_id); return null;
  end if;
  return jsonb_build_object('messageId',v_msg.msg_id,'readCount',v_msg.read_ct,'publicationId',v_publication_id,'workspaceId',v_workspace_id);
end;
$$;

create or replace function public.complete_publication(p_message_id bigint, p_publication_id uuid, p_workspace_id uuid, p_external_id text, p_external_url text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_publication public.publications%rowtype;
begin
  select * into v_publication from public.publications where id = p_publication_id and workspace_id = p_workspace_id for update;
  if not found or p_external_id is null or length(p_external_id) > 160 or p_external_url !~ '^https://(www[.]?)?youtube[.]com/' then raise exception 'Invalid YouTube publication result'; end if;
  update public.publications set status = case when scheduled_at is not null then 'scheduled'::public.publication_status
      when visibility = 'public' then 'published'::public.publication_status else 'uploaded_private'::public.publication_status end,
    external_id = p_external_id, external_url = p_external_url, uploaded_at = now(), last_error = null where id = p_publication_id;
  perform pgmq.archive('publish_jobs', p_message_id);
end;
$$;

create or replace function public.fail_publication(p_message_id bigint, p_publication_id uuid, p_workspace_id uuid, p_error text, p_attempt integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_attempt integer := greatest(1,least(p_attempt,3));
begin
  update public.publications set attempts = v_attempt, last_error = left(coalesce(p_error,'YouTube upload failed.'),500),
    status = case when v_attempt >= 3 then 'failed'::public.publication_status else 'queued'::public.publication_status end
    where id = p_publication_id and workspace_id = p_workspace_id and status not in ('published','scheduled','uploaded_private');
  if not found then return false; end if;
  if v_attempt >= 3 then perform pgmq.archive('publish_jobs', p_message_id);
  else perform pgmq.set_vt('publish_jobs', p_message_id, least(3600,30 * (2 ^ (v_attempt - 1))::integer)); end if;
  return true;
end;
$$;

create or replace function public.disconnect_platform_account(p_account_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_account public.platform_accounts%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into v_account from public.platform_accounts where id = p_account_id for update;
  if not found or not private.has_workspace_role(v_account.workspace_id,array['owner','admin','editor']::public.workspace_role[]) then raise exception 'Account not found or insufficient role'; end if;
  delete from public.platform_account_secrets where platform_account_id = v_account.id;
  update public.platform_accounts set connection_status='disconnected',external_account_id='',display_name='Conta desconectada',scopes='{}',updated_at=now() where id=v_account.id;
end;
$$;

revoke all on function public.start_youtube_publication(uuid,text,text,text[],text,timestamptz) from public,anon;
revoke all on function public.claim_publication(integer) from public,anon,authenticated;
revoke all on function public.complete_publication(bigint,uuid,uuid,text,text) from public,anon,authenticated;
revoke all on function public.fail_publication(bigint,uuid,uuid,text,integer) from public,anon,authenticated;
revoke all on function public.disconnect_platform_account(uuid) from public,anon;
grant execute on function public.start_youtube_publication(uuid,text,text,text[],text,timestamptz) to authenticated;
grant execute on function public.claim_publication(integer), public.complete_publication(bigint,uuid,uuid,text,text), public.fail_publication(bigint,uuid,uuid,text,integer) to service_role;
grant execute on function public.disconnect_platform_account(uuid) to authenticated;
