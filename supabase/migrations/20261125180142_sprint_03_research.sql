create table public.research_runs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  channel_id uuid not null,
  status text not null check (status in ('running', 'completed', 'failed')),
  started_by uuid references public.profiles(id) on delete set null,
  query text not null,
  sources_consulted jsonb not null default '[]'::jsonb,
  findings_created integer not null default 0 check (findings_created >= 0),
  duplicates_skipped integer not null default 0 check (duplicates_skipped >= 0),
  error_summary text,
  started_at timestamptz not null default now(),
  completed_at timestamptz,
  foreign key (channel_id, workspace_id) references public.channels(id, workspace_id) on delete cascade,
  unique (id, workspace_id)
);

create index research_runs_workspace_started_idx
  on public.research_runs(workspace_id, started_at desc);
create unique index research_runs_one_active_per_channel_idx
  on public.research_runs(workspace_id, channel_id) where status = 'running';

alter table public.topics
  add column research_run_id uuid,
  add column classification_score smallint check (classification_score is null or classification_score between 0 and 100),
  add column classification_rationale text,
  add column evidence jsonb not null default '[]'::jsonb;

alter table public.topics add constraint topics_research_run_workspace_fkey
  foreign key (research_run_id, workspace_id)
  references public.research_runs(id, workspace_id) on delete set null (research_run_id);

create index topics_research_run_idx on public.topics(research_run_id) where research_run_id is not null;

alter table public.research_runs enable row level security;

create policy "Workspace members read research runs" on public.research_runs for select to authenticated
  using (private.is_workspace_member(workspace_id));
create policy "Editors manage research runs" on public.research_runs for all to authenticated
  using (private.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]))
  with check (private.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]));

grant select, insert, update on public.research_runs to authenticated;
