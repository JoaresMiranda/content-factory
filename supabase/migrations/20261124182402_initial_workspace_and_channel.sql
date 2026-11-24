create extension if not exists "pgcrypto" with schema extensions;

create type public.workspace_role as enum ('owner', 'admin', 'editor', 'viewer');

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (length(trim(name)) > 0),
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now()
);

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_auth_user();

create table public.workspace_members (
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null references public.profiles(id) on delete cascade,
  role public.workspace_role not null default 'viewer',
  created_at timestamptz not null default now(),
  primary key (workspace_id, user_id)
);
create index workspace_members_user_id_idx on public.workspace_members(user_id);

create table public.channels (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  niche text,
  language text not null default 'pt-BR',
  created_at timestamptz not null default now(),
  unique (workspace_id, name)
);
create index channels_workspace_id_idx on public.channels(workspace_id);

create or replace function public.is_workspace_member(target_workspace uuid)
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

create or replace function public.has_workspace_role(target_workspace uuid, allowed_roles public.workspace_role[])
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

alter table public.workspaces enable row level security;
alter table public.profiles enable row level security;
alter table public.workspace_members enable row level security;
alter table public.channels enable row level security;

create policy "Members can read their workspaces" on public.workspaces for select to authenticated
  using (public.is_workspace_member(id));
create policy "Owners and admins can update workspaces" on public.workspaces for update to authenticated
  using (public.has_workspace_role(id, array['owner','admin']::public.workspace_role[]))
  with check (public.has_workspace_role(id, array['owner','admin']::public.workspace_role[]));
create policy "Users can read their own profile" on public.profiles for select to authenticated using (id = (select auth.uid()));
create policy "Users can update their own profile" on public.profiles for update to authenticated
  using (id = (select auth.uid())) with check (id = (select auth.uid()));
create policy "Members can read workspace membership" on public.workspace_members for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy "Owners and admins manage workspace membership" on public.workspace_members for all to authenticated
  using (public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[]))
  with check (public.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[]));
create policy "Members can read channels" on public.channels for select to authenticated
  using (public.is_workspace_member(workspace_id));
create policy "Editors and admins manage channels" on public.channels for all to authenticated
  using (public.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]))
  with check (public.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]));

grant usage on schema public to authenticated;
grant select, update on public.workspaces to authenticated;
grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on public.workspace_members to authenticated;
grant select, insert, update, delete on public.channels to authenticated;
