alter table public.script_scenes add column voice_generation_started_by uuid references public.profiles(id) on delete set null;

create or replace function public.begin_scene_voice_generation(p_scene_id uuid, p_voice_id text, p_speed numeric)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_workspace_id uuid;
  v_status public.script_version_status;
  v_updated integer;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  if length(trim(coalesce(p_voice_id, ''))) not between 1 and 160 or p_speed not between 0.70 and 1.20 then
    raise exception 'Invalid voice settings';
  end if;
  select scene.workspace_id, version.status into v_workspace_id, v_status
    from public.script_scenes scene
    join public.script_versions version on version.id = scene.script_version_id and version.workspace_id = scene.workspace_id
    where scene.id = p_scene_id for update of scene;
  if v_workspace_id is null or v_status <> 'approved'
    or not private.has_workspace_role(v_workspace_id, array['owner','admin','editor']::public.workspace_role[]) then
    raise exception 'Approved scene not found or unauthorized';
  end if;
  update public.script_scenes set voice_generation_started_at = now(), voice_generation_started_by = auth.uid(), voice_id = p_voice_id, voice_speed = p_speed
    where id = p_scene_id and workspace_id = v_workspace_id
      and (voice_generation_started_at is null or voice_generation_started_at < now() - interval '10 minutes');
  get diagnostics v_updated = row_count;
  return v_updated = 1;
end;
$$;

create or replace function public.complete_scene_voice_generation(p_scene_id uuid, p_audio_asset_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_scene public.script_scenes%rowtype;
  v_script public.scripts%rowtype;
  v_version public.script_versions%rowtype;
  v_asset public.media_assets%rowtype;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  select * into v_scene from public.script_scenes where id = p_scene_id for update;
  if not found or v_scene.voice_generation_started_by <> auth.uid()
    or not private.has_workspace_role(v_scene.workspace_id, array['owner','admin','editor']::public.workspace_role[]) then
    raise exception 'Voice generation reservation not found or unauthorized';
  end if;
  select * into v_version from public.script_versions where id = v_scene.script_version_id and workspace_id = v_scene.workspace_id;
  if v_version.status <> 'approved' then raise exception 'Only approved scripts can have narration'; end if;
  select * into v_script from public.scripts where id = v_scene.script_id and workspace_id = v_scene.workspace_id;
  select * into v_asset from public.media_assets where id = p_audio_asset_id and workspace_id = v_scene.workspace_id;
  if not found or v_asset.kind <> 'audio' or v_asset.channel_id <> v_script.channel_id then
    raise exception 'Audio asset not found in the script workspace';
  end if;
  update public.script_scenes set narration_audio_asset_id = v_asset.id, narration_audio_generated_at = now(),
    voice_generation_started_at = null, voice_generation_started_by = null
    where id = p_scene_id and workspace_id = v_scene.workspace_id;
end;
$$;

create or replace function public.cancel_scene_voice_generation(p_scene_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  update public.script_scenes set voice_generation_started_at = null, voice_generation_started_by = null
    where id = p_scene_id and voice_generation_started_by = auth.uid()
      and private.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]);
end;
$$;

revoke all on function public.begin_scene_voice_generation(uuid, text, numeric) from public, anon;
revoke all on function public.complete_scene_voice_generation(uuid, uuid) from public, anon;
revoke all on function public.cancel_scene_voice_generation(uuid) from public, anon;
grant execute on function public.begin_scene_voice_generation(uuid, text, numeric) to authenticated;
grant execute on function public.complete_scene_voice_generation(uuid, uuid) to authenticated;
grant execute on function public.cancel_scene_voice_generation(uuid) to authenticated;
