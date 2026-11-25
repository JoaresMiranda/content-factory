create index if not exists video_metrics_publication_workspace_idx on public.video_metrics(publication_id, workspace_id);
create index if not exists video_metrics_channel_workspace_idx on public.video_metrics(channel_id, workspace_id);
