drop policy "Editors and admins manage channels" on public.channels;

create policy "Admins manage channels" on public.channels for all to authenticated
  using (private.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[]))
  with check (private.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[]));
