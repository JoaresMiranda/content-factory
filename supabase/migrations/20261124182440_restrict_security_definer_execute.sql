revoke execute on function public.handle_new_auth_user() from public, anon, authenticated;

revoke execute on function public.is_workspace_member(uuid) from public, anon;
grant execute on function public.is_workspace_member(uuid) to authenticated;

revoke execute on function public.has_workspace_role(uuid, public.workspace_role[]) from public, anon;
grant execute on function public.has_workspace_role(uuid, public.workspace_role[]) to authenticated;
