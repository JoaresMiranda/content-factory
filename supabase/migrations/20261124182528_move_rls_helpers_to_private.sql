create schema if not exists private;
revoke all on schema private from public, anon;
grant usage on schema private to authenticated;

create or replace function private.is_workspace_member(target_workspace uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = target_workspace and wm.user_id = (select auth.uid())
  );
$$;

create or replace function private.has_workspace_role(target_workspace uuid, allowed_roles public.workspace_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.workspace_members wm
    where wm.workspace_id = target_workspace and wm.user_id = (select auth.uid()) and wm.role = any(allowed_roles)
  );
$$;

revoke execute on function private.is_workspace_member(uuid) from public, anon;
revoke execute on function private.has_workspace_role(uuid, public.workspace_role[]) from public, anon;
grant execute on function private.is_workspace_member(uuid) to authenticated;
grant execute on function private.has_workspace_role(uuid, public.workspace_role[]) to authenticated;

drop policy "Members can read their workspaces" on public.workspaces;
drop policy "Owners and admins can update workspaces" on public.workspaces;
drop policy "Members can read workspace membership" on public.workspace_members;
drop policy "Owners and admins manage workspace membership" on public.workspace_members;
drop policy "Members can read channels" on public.channels;
drop policy "Editors and admins manage channels" on public.channels;

create policy "Members can read their workspaces" on public.workspaces for select to authenticated
  using (private.is_workspace_member(id));
create policy "Owners and admins can update workspaces" on public.workspaces for update to authenticated
  using (private.has_workspace_role(id, array['owner','admin']::public.workspace_role[]))
  with check (private.has_workspace_role(id, array['owner','admin']::public.workspace_role[]));
create policy "Members can read workspace membership" on public.workspace_members for select to authenticated
  using (private.is_workspace_member(workspace_id));
create policy "Owners and admins manage workspace membership" on public.workspace_members for all to authenticated
  using (private.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[]))
  with check (private.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[]));
create policy "Members can read channels" on public.channels for select to authenticated
  using (private.is_workspace_member(workspace_id));
create policy "Editors and admins manage channels" on public.channels for all to authenticated
  using (private.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]))
  with check (private.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]));

drop function public.is_workspace_member(uuid);
drop function public.has_workspace_role(uuid, public.workspace_role[]);
