create type public.media_asset_kind as enum ('image', 'video', 'audio');

create table public.media_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  channel_id uuid not null,
  kind public.media_asset_kind not null,
  storage_path text not null unique,
  file_name text not null check (length(trim(file_name)) between 1 and 255),
  mime_type text not null,
  file_size_bytes bigint not null check (file_size_bytes between 1 and 52428800),
  origin text not null check (length(trim(origin)) between 2 and 240),
  source_url text,
  license_name text not null check (length(trim(license_name)) between 2 and 240),
  author text not null check (length(trim(author)) between 2 and 200),
  attribution text not null default '',
  notes text not null default '',
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (id, workspace_id),
  foreign key (channel_id, workspace_id) references public.channels(id, workspace_id) on delete cascade,
  check (source_url is null or source_url ~ '^https?://')
);

alter table public.script_scenes
  add constraint script_scenes_id_workspace_unique unique (id, workspace_id);

create table public.scene_media_assets (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null,
  script_scene_id uuid not null,
  media_asset_id uuid not null,
  linked_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  unique (script_scene_id),
  foreign key (script_scene_id, workspace_id) references public.script_scenes(id, workspace_id) on delete cascade,
  foreign key (media_asset_id, workspace_id) references public.media_assets(id, workspace_id) on delete cascade
);

alter table public.script_scenes
  add column voice_id text,
  add column voice_speed numeric(3,2) not null default 1.00 check (voice_speed between 0.70 and 1.20),
  add column voice_generation_started_at timestamptz,
  add column narration_audio_asset_id uuid,
  add column narration_audio_generated_at timestamptz,
  add constraint script_scenes_narration_audio_workspace_fkey
    foreign key (narration_audio_asset_id, workspace_id) references public.media_assets(id, workspace_id) on delete set null (narration_audio_asset_id);

create index media_assets_workspace_channel_created_idx on public.media_assets(workspace_id, channel_id, created_at desc);
create index media_assets_workspace_kind_created_idx on public.media_assets(workspace_id, kind, created_at desc);
create index scene_media_assets_workspace_scene_idx on public.scene_media_assets(workspace_id, script_scene_id);
create index script_scenes_narration_audio_idx on public.script_scenes(narration_audio_asset_id) where narration_audio_asset_id is not null;

alter table public.media_assets enable row level security;
alter table public.scene_media_assets enable row level security;

create policy "Workspace members read media assets" on public.media_assets for select to authenticated
  using (private.is_workspace_member(workspace_id));
create policy "Editors create media assets" on public.media_assets for insert to authenticated
  with check (private.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]) and created_by = auth.uid());
create policy "Editors update media assets" on public.media_assets for update to authenticated
  using (private.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]))
  with check (private.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]));
create policy "Editors delete media assets" on public.media_assets for delete to authenticated
  using (private.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]));

create policy "Workspace members read scene media links" on public.scene_media_assets for select to authenticated
  using (private.is_workspace_member(workspace_id));
create policy "Editors create scene media links" on public.scene_media_assets for insert to authenticated
  with check (private.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]) and linked_by = auth.uid());
create policy "Editors update scene media links" on public.scene_media_assets for update to authenticated
  using (private.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]))
  with check (private.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]));
create policy "Editors delete scene media links" on public.scene_media_assets for delete to authenticated
  using (private.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]));

grant select, insert, update, delete on public.media_assets, public.scene_media_assets to authenticated;
grant usage on type public.media_asset_kind to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'content-factory-media', 'content-factory-media', false, 52428800,
  array['image/jpeg','image/png','image/webp','image/gif','video/mp4','video/webm','video/quicktime','audio/mpeg']
)
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create policy "Workspace members read media objects" on storage.objects for select to authenticated
  using (
    bucket_id = 'content-factory-media'
    and exists (
      select 1 from public.workspace_members wm
      where wm.user_id = auth.uid() and wm.workspace_id::text = (storage.foldername(name))[1]
    )
  );
create policy "Workspace editors upload media objects" on storage.objects for insert to authenticated
  with check (
    bucket_id = 'content-factory-media'
    and exists (
      select 1 from public.workspace_members wm
      where wm.user_id = auth.uid()
        and wm.workspace_id::text = (storage.foldername(name))[1]
        and wm.role = any(array['owner','admin','editor']::public.workspace_role[])
    )
  );
create policy "Workspace editors update media objects" on storage.objects for update to authenticated
  using (
    bucket_id = 'content-factory-media'
    and exists (
      select 1 from public.workspace_members wm
      where wm.user_id = auth.uid()
        and wm.workspace_id::text = (storage.foldername(name))[1]
        and wm.role = any(array['owner','admin','editor']::public.workspace_role[])
    )
  )
  with check (
    bucket_id = 'content-factory-media'
    and exists (
      select 1 from public.workspace_members wm
      where wm.user_id = auth.uid()
        and wm.workspace_id::text = (storage.foldername(name))[1]
        and wm.role = any(array['owner','admin','editor']::public.workspace_role[])
    )
  );
create policy "Workspace editors delete media objects" on storage.objects for delete to authenticated
  using (
    bucket_id = 'content-factory-media'
    and exists (
      select 1 from public.workspace_members wm
      where wm.user_id = auth.uid()
        and wm.workspace_id::text = (storage.foldername(name))[1]
        and wm.role = any(array['owner','admin','editor']::public.workspace_role[])
    )
  );
