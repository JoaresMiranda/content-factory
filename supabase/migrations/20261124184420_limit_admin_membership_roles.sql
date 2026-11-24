drop policy "Owners and admins manage workspace membership" on public.workspace_members;

create policy "Owners manage workspace membership" on public.workspace_members for all to authenticated
  using (private.has_workspace_role(workspace_id, array['owner']::public.workspace_role[]))
  with check (private.has_workspace_role(workspace_id, array['owner']::public.workspace_role[]));

create policy "Admins can add editors and viewers" on public.workspace_members for insert to authenticated
  with check (
    private.has_workspace_role(workspace_id, array['admin']::public.workspace_role[])
    and role in ('editor', 'viewer')
  );

create policy "Admins can update non-owner members" on public.workspace_members for update to authenticated
  using (
    private.has_workspace_role(workspace_id, array['admin']::public.workspace_role[])
    and role <> 'owner'
  )
  with check (
    private.has_workspace_role(workspace_id, array['admin']::public.workspace_role[])
    and role in ('editor', 'viewer')
  );

create policy "Admins can remove non-owner members" on public.workspace_members for delete to authenticated
  using (
    private.has_workspace_role(workspace_id, array['admin']::public.workspace_role[])
    and role <> 'owner'
  );
