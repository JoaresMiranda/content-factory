create table public.publication_upload_sessions (
  publication_id uuid primary key,
  workspace_id uuid not null,
  resumable_uri_ciphertext text not null,
  updated_at timestamptz not null default now(),
  foreign key (publication_id, workspace_id) references public.publications(id, workspace_id) on delete cascade
);
alter table public.publication_upload_sessions enable row level security;
revoke all on public.publication_upload_sessions from public, anon, authenticated;
grant all on public.publication_upload_sessions to service_role;

create or replace function public.extend_publication_job(p_message_id bigint, p_visibility_seconds integer default 900)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  perform pgmq.set_vt('publish_jobs', p_message_id, greatest(60, least(p_visibility_seconds, 3600)));
  return true;
end;
$$;

create or replace function public.record_youtube_upload_result(p_publication_id uuid, p_workspace_id uuid, p_external_id text, p_external_url text)
returns void language plpgsql security definer set search_path = '' as $$
declare v_publication public.publications%rowtype;
begin
  select * into v_publication from public.publications where id = p_publication_id and workspace_id = p_workspace_id for update;
  if not found or p_external_id is null or length(p_external_id) not between 1 and 160 or p_external_url !~ '^https://(www[.]?)?youtube[.]com/' then
    raise exception 'Invalid YouTube upload result';
  end if;
  if v_publication.external_id is not null and v_publication.external_id <> p_external_id then raise exception 'Publication already has a different external video'; end if;
  update public.publications set external_id = p_external_id, external_url = p_external_url where id = p_publication_id;
end;
$$;

revoke all on function public.extend_publication_job(bigint,integer) from public,anon,authenticated;
revoke all on function public.record_youtube_upload_result(uuid,uuid,text,text) from public,anon,authenticated;
grant execute on function public.extend_publication_job(bigint,integer), public.record_youtube_upload_result(uuid,uuid,text,text) to service_role;
