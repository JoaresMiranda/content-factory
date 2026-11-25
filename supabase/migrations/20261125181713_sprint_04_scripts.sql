create type public.script_version_status as enum ('draft', 'pending_approval', 'approved', 'rejected');

create table public.scripts (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  channel_id uuid not null,
  topic_id uuid not null,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, workspace_id),
  unique (topic_id, workspace_id),
  foreign key (channel_id, workspace_id) references public.channels(id, workspace_id) on delete cascade,
  foreign key (topic_id, workspace_id) references public.topics(id, workspace_id) on delete cascade
);

create table public.script_versions (
  id uuid primary key default gen_random_uuid(),
  script_id uuid not null,
  workspace_id uuid not null,
  version_number integer not null check (version_number > 0),
  status public.script_version_status not null default 'draft',
  title text not null check (length(trim(title)) between 5 and 120),
  hook text not null check (length(trim(hook)) between 5 and 500),
  development text not null check (length(trim(development)) between 20 and 4000),
  conclusion text not null check (length(trim(conclusion)) between 5 and 800),
  cta text not null check (length(trim(cta)) between 3 and 300),
  estimated_duration_seconds smallint not null check (estimated_duration_seconds between 15 and 180),
  factual_references jsonb not null default '[]'::jsonb check (jsonb_typeof(factual_references) = 'array'),
  rejection_reason text,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  decision_by uuid references public.profiles(id) on delete set null,
  decision_at timestamptz,
  unique (script_id, workspace_id, version_number),
  unique (id, workspace_id),
  unique (id, script_id, workspace_id),
  foreign key (script_id, workspace_id) references public.scripts(id, workspace_id) on delete cascade,
  check ((status = 'rejected' and length(trim(coalesce(rejection_reason, ''))) >= 5) or status <> 'rejected')
);

create table public.script_generation_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  topic_id uuid not null,
  status text not null check (status in ('running', 'completed', 'failed')),
  started_by uuid not null references public.profiles(id),
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  error_summary text,
  foreign key (topic_id, workspace_id) references public.topics(id, workspace_id) on delete cascade,
  unique (id, workspace_id)
);

create table public.script_scenes (
  id uuid primary key default gen_random_uuid(),
  script_id uuid not null,
  script_version_id uuid not null,
  workspace_id uuid not null,
  position smallint not null check (position between 1 and 12),
  duration_seconds smallint not null check (duration_seconds between 2 and 30),
  narration text not null check (length(trim(narration)) between 1 and 1000),
  visual_description text not null check (length(trim(visual_description)) between 1 and 1200),
  image_search_terms text[] not null default '{}',
  unique (script_version_id, position),
  foreign key (script_id, workspace_id) references public.scripts(id, workspace_id) on delete cascade,
  foreign key (script_version_id, script_id, workspace_id) references public.script_versions(id, script_id, workspace_id) on delete cascade,
  check (cardinality(image_search_terms) between 1 and 6)
);

create index scripts_workspace_channel_idx on public.scripts(workspace_id, channel_id, created_at desc);
create index script_versions_script_version_idx on public.script_versions(script_id, version_number desc);
create index script_versions_workspace_status_idx on public.script_versions(workspace_id, status, created_at desc);
create index script_scenes_version_order_idx on public.script_scenes(script_version_id, position);
create index script_generation_runs_workspace_started_idx on public.script_generation_runs(workspace_id, started_at desc);
create unique index script_generation_runs_one_active_per_topic_idx on public.script_generation_runs(workspace_id, topic_id) where status = 'running';

create trigger scripts_set_updated_at before update on public.scripts for each row execute function private.set_updated_at();

alter table public.scripts enable row level security;
alter table public.script_versions enable row level security;
alter table public.script_scenes enable row level security;
alter table public.script_generation_runs enable row level security;

create policy "Workspace members read scripts" on public.scripts for select to authenticated
  using (private.is_workspace_member(workspace_id));
create policy "Workspace members read script versions" on public.script_versions for select to authenticated
  using (private.is_workspace_member(workspace_id));
create policy "Workspace members read script scenes" on public.script_scenes for select to authenticated
  using (private.is_workspace_member(workspace_id));
create policy "Workspace members read script generation runs" on public.script_generation_runs for select to authenticated
  using (private.is_workspace_member(workspace_id));

grant select on public.scripts, public.script_versions, public.script_scenes, public.script_generation_runs to authenticated;
grant usage on type public.script_version_status to authenticated;

create or replace function public.begin_script_generation(p_topic_id uuid)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_topic public.topics%rowtype;
  v_run_id uuid;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into v_topic from public.topics where id = p_topic_id for update;
  if not found or v_topic.status <> 'approved' then raise exception 'Only approved topics can have scripts'; end if;
  if not private.has_workspace_role(v_topic.workspace_id, array['owner','admin','editor']::public.workspace_role[]) then
    raise exception 'Insufficient workspace role';
  end if;
  if v_topic.reference_url is null
    and not exists(select 1 from jsonb_array_elements(case when jsonb_typeof(v_topic.evidence) = 'array' then v_topic.evidence else '[]'::jsonb end) as evidence where evidence->>'url' ~ '^https?://')
    and not exists(select 1 from public.topic_sources ts join public.sources src on src.id = ts.source_id and src.workspace_id = ts.workspace_id where ts.topic_id = v_topic.id and ts.workspace_id = v_topic.workspace_id and src.url ~ '^https?://') then
    raise exception 'A factual reference is required before generation';
  end if;
  update public.script_generation_runs set status = 'failed', completed_at = now(), error_summary = 'Execução expirada.'
    where topic_id = p_topic_id and workspace_id = v_topic.workspace_id and status = 'running' and started_at < now() - interval '10 minutes';
  insert into public.script_generation_runs (workspace_id, topic_id, status, started_by)
    values (v_topic.workspace_id, p_topic_id, 'running', auth.uid()) returning id into v_run_id;
  return v_run_id;
end;
$$;

create or replace function public.finish_script_generation(p_run_id uuid, p_error_summary text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_run public.script_generation_runs%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into v_run from public.script_generation_runs where id = p_run_id for update;
  if not found or v_run.started_by <> auth.uid() or not private.has_workspace_role(v_run.workspace_id, array['owner','admin','editor']::public.workspace_role[]) then
    raise exception 'Generation run not found or unauthorized';
  end if;
  if v_run.status <> 'running' then raise exception 'Generation run is already closed'; end if;
  update public.script_generation_runs set status = 'failed', completed_at = now(), error_summary = left(coalesce(p_error_summary, 'Geração cancelada.'), 500) where id = p_run_id;
end;
$$;

create or replace function public.create_script_version(p_topic_id uuid, p_script_id uuid, p_generation_run_id uuid, p_content jsonb)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_topic public.topics%rowtype;
  v_script_id uuid;
  v_script_version_id uuid;
  v_version_number integer;
  v_scene jsonb;
  v_reference jsonb;
  v_run public.script_generation_runs%rowtype;
  v_position integer := 0;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into v_topic from public.topics where id = p_topic_id for update;
  if not found or v_topic.status <> 'approved' then raise exception 'Only approved topics can have scripts'; end if;
  if not private.has_workspace_role(v_topic.workspace_id, array['owner','admin','editor']::public.workspace_role[]) then
    raise exception 'Insufficient workspace role';
  end if;
  if jsonb_typeof(p_content) is distinct from 'object'
    or jsonb_typeof(p_content->'scenes') is distinct from 'array'
    or jsonb_array_length(coalesce(p_content->'scenes', '[]'::jsonb)) not between 3 and 12
    or jsonb_typeof(p_content->'factualReferences') is distinct from 'array'
    or jsonb_array_length(coalesce(p_content->'factualReferences', '[]'::jsonb)) not between 1 and 8 then
    raise exception 'Invalid script content';
  end if;
  for v_reference in select value from jsonb_array_elements(p_content->'factualReferences') loop
    if coalesce(v_reference->>'url', '') !~ '^https?://'
      or length(trim(coalesce(v_reference->>'claim', ''))) < 5
      or not (
        v_topic.reference_url = v_reference->>'url'
        or exists(select 1 from jsonb_array_elements(case when jsonb_typeof(v_topic.evidence) = 'array' then v_topic.evidence else '[]'::jsonb end) as evidence where evidence->>'url' = v_reference->>'url')
        or exists(select 1 from public.topic_sources ts join public.sources src on src.id = ts.source_id and src.workspace_id = ts.workspace_id where ts.topic_id = v_topic.id and ts.workspace_id = v_topic.workspace_id and src.url = v_reference->>'url')
      ) then
      raise exception 'Each factual reference must point to a registered topic source';
    end if;
  end loop;

  if p_generation_run_id is not null then
    select * into v_run from public.script_generation_runs where id = p_generation_run_id for update;
    if not found or v_run.topic_id <> v_topic.id or v_run.workspace_id <> v_topic.workspace_id
      or v_run.started_by <> auth.uid() or v_run.status <> 'running' then
      raise exception 'Active generation run not found';
    end if;
  end if;

  if p_script_id is null then
    select id into v_script_id from public.scripts where topic_id = p_topic_id and workspace_id = v_topic.workspace_id for update;
    if v_script_id is null then
      insert into public.scripts (workspace_id, channel_id, topic_id, created_by)
      values (v_topic.workspace_id, v_topic.channel_id, v_topic.id, auth.uid()) returning id into v_script_id;
    end if;
  else
    select id into v_script_id from public.scripts
      where id = p_script_id and topic_id = p_topic_id and workspace_id = v_topic.workspace_id for update;
    if v_script_id is null then raise exception 'Script not found in this workspace'; end if;
  end if;

  select coalesce(max(version_number), 0) + 1 into v_version_number
    from public.script_versions where script_id = v_script_id and workspace_id = v_topic.workspace_id;

  insert into public.script_versions (
    script_id, workspace_id, version_number, title, hook, development, conclusion, cta,
    estimated_duration_seconds, factual_references, created_by
  ) values (
    v_script_id, v_topic.workspace_id, v_version_number, p_content->>'title', p_content->>'hook',
    p_content->>'development', p_content->>'conclusion', p_content->>'cta',
    (p_content->>'estimatedDurationSeconds')::smallint, p_content->'factualReferences', auth.uid()
  ) returning id into v_script_version_id;

  for v_scene in select value from jsonb_array_elements(p_content->'scenes') loop
    v_position := v_position + 1;
    insert into public.script_scenes (
      script_id, script_version_id, workspace_id, position, duration_seconds,
      narration, visual_description, image_search_terms
    ) values (
      v_script_id, v_script_version_id, v_topic.workspace_id, v_position,
      (v_scene->>'durationSeconds')::smallint, v_scene->>'narration', v_scene->>'visualDescription',
      array(select jsonb_array_elements_text(v_scene->'imageSearchTerms'))
    );
  end loop;

  if p_generation_run_id is not null then
    update public.script_generation_runs set status = 'completed', completed_at = now(), error_summary = null where id = p_generation_run_id;
  end if;

  update public.scripts set updated_at = now() where id = v_script_id;
  return jsonb_build_object('scriptId', v_script_id, 'versionId', v_script_version_id, 'versionNumber', v_version_number);
end;
$$;

create or replace function public.decide_script_version(p_version_id uuid, p_decision text, p_reason text default null)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_version public.script_versions%rowtype;
  v_workspace_id uuid;
  v_latest integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select s.workspace_id into v_workspace_id from public.script_versions sv
    join public.scripts s on s.id = sv.script_id and s.workspace_id = sv.workspace_id
    where sv.id = p_version_id;
  if v_workspace_id is null or not private.has_workspace_role(v_workspace_id, array['owner','admin','editor']::public.workspace_role[]) then
    raise exception 'Script not found or insufficient workspace role';
  end if;
  select * into v_version from public.script_versions where id = p_version_id for update;
  select max(version_number) into v_latest from public.script_versions where script_id = v_version.script_id;
  if v_version.version_number <> v_latest then raise exception 'Only the latest script version can be decided'; end if;

  if p_decision = 'pending_approval' and v_version.status = 'draft' then
    update public.script_versions set status = 'pending_approval' where id = p_version_id;
  elsif p_decision = 'approved' and v_version.status = 'pending_approval' then
    update public.script_versions set status = 'approved', decision_by = auth.uid(), decision_at = now(), rejection_reason = null where id = p_version_id;
  elsif p_decision = 'rejected' and v_version.status = 'pending_approval' and length(trim(coalesce(p_reason, ''))) >= 5 then
    update public.script_versions set status = 'rejected', decision_by = auth.uid(), decision_at = now(), rejection_reason = trim(p_reason) where id = p_version_id;
  else
    raise exception 'Invalid script decision transition';
  end if;
end;
$$;

revoke all on function public.begin_script_generation(uuid) from public, anon;
revoke all on function public.finish_script_generation(uuid, text) from public, anon;
revoke all on function public.create_script_version(uuid, uuid, uuid, jsonb) from public, anon;
revoke all on function public.decide_script_version(uuid, text, text) from public, anon;
grant execute on function public.begin_script_generation(uuid) to authenticated;
grant execute on function public.finish_script_generation(uuid, text) to authenticated;
grant execute on function public.create_script_version(uuid, uuid, uuid, jsonb) to authenticated;
grant execute on function public.decide_script_version(uuid, text, text) to authenticated;
