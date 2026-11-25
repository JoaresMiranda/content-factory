create table public.video_metrics (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  channel_id uuid not null,
  publication_id uuid not null,
  platform public.platform_name not null default 'youtube' check (platform = 'youtube'),
  captured_on date not null default (timezone('utc', now())::date),
  views bigint check (views is null or views >= 0),
  likes bigint check (likes is null or likes >= 0),
  comments bigint check (comments is null or comments >= 0),
  shares bigint check (shares is null or shares >= 0),
  watch_time_minutes numeric(14,2) check (watch_time_minutes is null or watch_time_minutes >= 0),
  average_view_duration_seconds numeric(10,2) check (average_view_duration_seconds is null or average_view_duration_seconds >= 0),
  average_view_percentage numeric(8,3) check (average_view_percentage is null or average_view_percentage >= 0),
  subscribers_gained bigint check (subscribers_gained is null or subscribers_gained >= 0),
  created_at timestamptz not null default now(),
  unique (publication_id, captured_on),
  foreign key (publication_id, workspace_id) references public.publications(id, workspace_id) on delete cascade,
  foreign key (channel_id, workspace_id) references public.channels(id, workspace_id) on delete cascade
);

create index video_metrics_workspace_date_idx on public.video_metrics(workspace_id, captured_on desc);
create index video_metrics_channel_date_idx on public.video_metrics(channel_id, captured_on desc);
create index video_metrics_publication_workspace_idx on public.video_metrics(publication_id, workspace_id);
create index video_metrics_channel_workspace_idx on public.video_metrics(channel_id, workspace_id);

alter table public.video_metrics enable row level security;
create policy "Workspace members read video metrics" on public.video_metrics for select to authenticated
  using (private.is_workspace_member(workspace_id));
revoke all on public.video_metrics from public, anon;
grant select on public.video_metrics to authenticated;
grant all on public.video_metrics to service_role;
grant usage on type public.platform_name to authenticated;
