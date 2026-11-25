create schema if not exists pgmq;
create extension if not exists pgmq with schema pgmq;

do $$
declare v_queue_name text;
begin
  foreach v_queue_name in array array['research_jobs', 'render_jobs', 'publish_jobs'] loop
    if not exists (select 1 from pgmq.list_queues() q where q.queue_name = v_queue_name) then
      perform pgmq.create(v_queue_name);
    end if;
  end loop;
end;
$$;

create type public.production_job_status as enum ('queued', 'rendering', 'completed', 'failed', 'cancelled');
create type public.video_review_status as enum ('pending_approval', 'approved', 'rejected', 'revision_requested');

create table public.production_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  channel_id uuid not null,
  script_id uuid not null,
  script_version_id uuid not null,
  status public.production_job_status not null default 'queued',
  attempts smallint not null default 0 check (attempts between 0 and 3),
  last_error text,
  queue_message_id bigint,
  requested_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  started_at timestamptz,
  completed_at timestamptz,
  unique (id, workspace_id),
  foreign key (channel_id, workspace_id) references public.channels(id, workspace_id) on delete cascade,
  foreign key (script_id, workspace_id) references public.scripts(id, workspace_id) on delete cascade,
  foreign key (script_version_id, script_id, workspace_id) references public.script_versions(id, script_id, workspace_id) on delete cascade
);

create unique index production_jobs_one_active_version_idx on public.production_jobs(script_version_id)
  where status in ('queued', 'rendering');
create index production_jobs_workspace_created_idx on public.production_jobs(workspace_id, created_at desc);

create table public.videos (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  channel_id uuid not null,
  production_job_id uuid not null unique,
  script_version_id uuid not null,
  status public.video_review_status not null default 'pending_approval',
  video_storage_path text not null,
  thumbnail_storage_path text not null,
  duration_seconds integer not null check (duration_seconds between 1 and 180),
  file_size_bytes bigint not null check (file_size_bytes between 1 and 52428800),
  resolution text not null default '1080x1920' check (resolution = '1080x1920'),
  frame_rate smallint not null default 30 check (frame_rate = 30),
  codec text not null default 'h264+aac',
  decision_by uuid references public.profiles(id) on delete set null,
  decision_at timestamptz,
  decision_reason text,
  created_at timestamptz not null default now(),
  unique (id, workspace_id),
  foreign key (channel_id, workspace_id) references public.channels(id, workspace_id) on delete cascade,
  foreign key (production_job_id, workspace_id) references public.production_jobs(id, workspace_id) on delete cascade,
  foreign key (script_version_id, workspace_id) references public.script_versions(id, workspace_id) on delete cascade,
  check ((status in ('rejected', 'revision_requested') and length(trim(coalesce(decision_reason, ''))) >= 5) or status not in ('rejected', 'revision_requested'))
);

create index videos_workspace_created_idx on public.videos(workspace_id, created_at desc);
alter table public.production_jobs enable row level security;
alter table public.videos enable row level security;
create policy "Workspace members read production jobs" on public.production_jobs for select to authenticated
  using (private.is_workspace_member(workspace_id));
create policy "Workspace members read videos" on public.videos for select to authenticated
  using (private.is_workspace_member(workspace_id));
grant select on public.production_jobs, public.videos to authenticated;
grant usage on type public.production_job_status, public.video_review_status to authenticated;

create or replace function public.start_video_production(p_script_version_id uuid)
returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_version public.script_versions%rowtype;
  v_script public.scripts%rowtype;
  v_job_id uuid;
  v_message_id bigint;
  v_color text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into v_version from public.script_versions where id = p_script_version_id for update;
  if not found or v_version.status <> 'approved' then raise exception 'Only an approved script can be rendered'; end if;
  select * into v_script from public.scripts where id = v_version.script_id and workspace_id = v_version.workspace_id;
  if not private.has_workspace_role(v_version.workspace_id, array['owner','admin','editor']::public.workspace_role[]) then raise exception 'Insufficient workspace role'; end if;
  if exists (select 1 from public.script_versions newer where newer.script_id = v_version.script_id and newer.version_number > v_version.version_number) then
    raise exception 'Only the latest script version can be rendered';
  end if;
  if not exists (select 1 from public.script_scenes s where s.script_version_id = v_version.id and s.workspace_id = v_version.workspace_id)
    or exists (
      select 1 from public.script_scenes s
      left join public.media_assets audio on audio.id = s.narration_audio_asset_id and audio.workspace_id = s.workspace_id and audio.kind = 'audio'
      left join public.scene_media_assets link on link.script_scene_id = s.id and link.workspace_id = s.workspace_id
      left join public.media_assets visual on visual.id = link.media_asset_id and visual.workspace_id = s.workspace_id and visual.kind in ('image','video')
      where s.script_version_id = v_version.id and (audio.id is null or visual.id is null)
    ) then raise exception 'Every scene needs narration and a visual asset';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_script_version_id::text, 0));
  select id into v_job_id from public.production_jobs where script_version_id = p_script_version_id and status in ('queued','rendering') limit 1;
  if v_job_id is not null then return v_job_id; end if;
  insert into public.production_jobs (workspace_id, channel_id, script_id, script_version_id, requested_by)
    values (v_version.workspace_id, v_script.channel_id, v_script.id, v_version.id, auth.uid()) returning id into v_job_id;
  select coalesce(c.visual_identity->>'primaryColor', '#087e8b') into v_color from public.channels c where c.id = v_script.channel_id;
  select pgmq.send('render_jobs', jsonb_build_object('jobId', v_job_id, 'workspaceId', v_version.workspace_id, 'primaryColor', v_color)) into v_message_id;
  update public.production_jobs set queue_message_id = v_message_id where id = v_job_id;
  return v_job_id;
end;
$$;

create or replace function public.decide_video(p_video_id uuid, p_decision text, p_reason text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare v_video public.videos%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if p_decision not in ('approved','rejected','revision_requested') then raise exception 'Invalid video decision'; end if;
  select * into v_video from public.videos where id = p_video_id for update;
  if not found or not private.has_workspace_role(v_video.workspace_id, array['owner','admin','editor']::public.workspace_role[]) then raise exception 'Video not found or insufficient role'; end if;
  if v_video.status <> 'pending_approval' then raise exception 'Video was already reviewed'; end if;
  if p_decision <> 'approved' and length(trim(coalesce(p_reason, ''))) < 5 then raise exception 'A reason of at least five characters is required'; end if;
  update public.videos set status = p_decision::public.video_review_status,
    decision_by = auth.uid(), decision_at = now(), decision_reason = case when p_decision = 'approved' then null else trim(p_reason) end
    where id = p_video_id;
end;
$$;

create or replace function public.claim_render_job(p_visibility_seconds integer default 900)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare v_msg record; v_job_id uuid; v_workspace_id uuid;
begin
  select * into v_msg from pgmq.read('render_jobs', greatest(60, least(p_visibility_seconds, 3600)), 1);
  if not found then return null; end if;
  v_job_id := (v_msg.message->>'jobId')::uuid;
  v_workspace_id := (v_msg.message->>'workspaceId')::uuid;
  update public.production_jobs set status = 'rendering', attempts = least(v_msg.read_ct, 3), started_at = coalesce(started_at, now()), last_error = null
    where id = v_job_id and workspace_id = v_workspace_id and status in ('queued','rendering');
  if not found then perform pgmq.archive('render_jobs', v_msg.msg_id); return null; end if;
  if v_msg.read_ct > 3 then
    update public.production_jobs set status = 'failed', last_error = 'Limite de tentativas excedido.', completed_at = now() where id = v_job_id;
    perform pgmq.archive('render_jobs', v_msg.msg_id); return null;
  end if;
  return jsonb_build_object('messageId', v_msg.msg_id, 'readCount', v_msg.read_ct, 'jobId', v_job_id, 'workspaceId', v_workspace_id);
end;
$$;

create or replace function public.extend_render_job(p_message_id bigint, p_visibility_seconds integer default 900)
returns boolean language plpgsql security definer set search_path = '' as $$
begin
  perform pgmq.set_vt('render_jobs', p_message_id, greatest(60, least(p_visibility_seconds, 3600)));
  return true;
end;
$$;

create or replace function public.complete_render_job(p_message_id bigint, p_job_id uuid, p_workspace_id uuid,
  p_video_path text, p_thumbnail_path text, p_duration_seconds integer, p_file_size_bytes bigint)
returns uuid language plpgsql security definer set search_path = '' as $$
declare v_job public.production_jobs%rowtype; v_video_id uuid;
begin
  if p_video_path !~ ('^' || p_workspace_id::text || '/renders/' || p_job_id::text || '/video\.mp4$')
    or p_thumbnail_path !~ ('^' || p_workspace_id::text || '/renders/' || p_job_id::text || '/thumbnail\.jpg$')
    or p_duration_seconds not between 1 and 180 or p_file_size_bytes not between 1 and 52428800 then raise exception 'Invalid render output'; end if;
  select * into v_job from public.production_jobs where id = p_job_id and workspace_id = p_workspace_id for update;
  if not found then raise exception 'Production job not found'; end if;
  select id into v_video_id from public.videos where production_job_id = p_job_id;
  if v_video_id is null then
    insert into public.videos (workspace_id, channel_id, production_job_id, script_version_id, video_storage_path, thumbnail_storage_path, duration_seconds, file_size_bytes)
      values (v_job.workspace_id, v_job.channel_id, v_job.id, v_job.script_version_id, p_video_path, p_thumbnail_path, p_duration_seconds, p_file_size_bytes)
      returning id into v_video_id;
  end if;
  update public.production_jobs set status = 'completed', completed_at = now(), last_error = null where id = p_job_id;
  perform pgmq.archive('render_jobs', p_message_id);
  return v_video_id;
end;
$$;

create or replace function public.fail_render_job(p_message_id bigint, p_job_id uuid, p_workspace_id uuid, p_error text, p_attempt integer)
returns boolean language plpgsql security definer set search_path = '' as $$
declare v_attempt integer := greatest(1, least(p_attempt, 3));
begin
  update public.production_jobs set attempts = v_attempt, last_error = left(coalesce(p_error, 'Falha no processamento.'), 500),
    status = case when v_attempt >= 3 then 'failed'::public.production_job_status else 'queued'::public.production_job_status end,
    completed_at = case when v_attempt >= 3 then now() else null end
    where id = p_job_id and workspace_id = p_workspace_id and status <> 'completed';
  if not found then return false; end if;
  if v_attempt >= 3 then perform pgmq.archive('render_jobs', p_message_id);
  else perform pgmq.set_vt('render_jobs', p_message_id, least(3600, 30 * (2 ^ (v_attempt - 1))::integer)); end if;
  return true;
end;
$$;

revoke all on function public.start_video_production(uuid) from public, anon;
revoke all on function public.decide_video(uuid, text, text) from public, anon;
revoke all on function public.claim_render_job(integer) from public, anon, authenticated;
revoke all on function public.extend_render_job(bigint, integer) from public, anon, authenticated;
revoke all on function public.complete_render_job(bigint, uuid, uuid, text, text, integer, bigint) from public, anon, authenticated;
revoke all on function public.fail_render_job(bigint, uuid, uuid, text, integer) from public, anon, authenticated;
grant execute on function public.start_video_production(uuid) to authenticated;
grant execute on function public.decide_video(uuid, text, text) to authenticated;
grant execute on function public.claim_render_job(integer), public.extend_render_job(bigint, integer),
  public.complete_render_job(bigint, uuid, uuid, text, text, integer, bigint), public.fail_render_job(bigint, uuid, uuid, text, integer) to service_role;
