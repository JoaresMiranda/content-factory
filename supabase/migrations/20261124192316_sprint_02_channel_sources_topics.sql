create type public.source_type as enum (
  'institutional_site', 'scientific_journal', 'university', 'news_portal',
  'environmental_organization', 'rss_feed', 'api'
);

create type public.topic_status as enum ('draft', 'pending_approval', 'approved', 'rejected', 'archived');

alter table public.channels
  add column slug text,
  add column description text,
  add column country_code text not null default 'BR',
  add column timezone text not null default 'America/Fortaleza',
  add column is_active boolean not null default true,
  add column visual_identity jsonb not null default '{}'::jsonb,
  add column updated_at timestamptz not null default now();

update public.channels
set slug = trim(both '-' from regexp_replace(lower(name), '[^a-z0-9]+', '-', 'g')),
    description = coalesce(description, 'Vida marinha, curiosidades dos oceanos, criaturas extraordinárias, fenômenos submarinos e descobertas científicas.')
where slug is null;

alter table public.channels alter column slug set not null;
alter table public.channels add constraint channels_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$');
alter table public.channels add constraint channels_workspace_slug_unique unique (workspace_id, slug);
alter table public.channels add constraint channels_id_workspace_unique unique (id, workspace_id);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  channel_id uuid not null,
  name text not null check (length(trim(name)) > 0),
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  description text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (channel_id, slug),
  unique (id, workspace_id),
  unique (id, channel_id, workspace_id),
  foreign key (channel_id, workspace_id) references public.channels(id, workspace_id) on delete cascade
);

create table public.sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  name text not null check (length(trim(name)) > 0),
  url text not null check (url ~ '^https?://'),
  type public.source_type not null,
  description text,
  is_active boolean not null default true,
  last_accessed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, url),
  unique (id, workspace_id)
);

create table public.source_categories (
  workspace_id uuid not null,
  source_id uuid not null,
  category_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (source_id, category_id),
  foreign key (source_id, workspace_id) references public.sources(id, workspace_id) on delete cascade,
  foreign key (category_id, workspace_id) references public.categories(id, workspace_id) on delete cascade
);

create table public.topics (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  channel_id uuid not null,
  category_id uuid,
  title text not null check (length(trim(title)) > 0),
  summary text,
  context text,
  reference_url text check (reference_url is null or reference_url ~ '^https?://'),
  original_published_at timestamptz,
  status public.topic_status not null default 'draft',
  internal_notes text,
  rejection_reason text,
  decision_by uuid references public.profiles(id) on delete set null,
  decision_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (channel_id, workspace_id) references public.channels(id, workspace_id) on delete cascade,
  foreign key (category_id, channel_id, workspace_id) references public.categories(id, channel_id, workspace_id) on delete set null (category_id),
  unique (id, workspace_id)
);

create table public.topic_sources (
  workspace_id uuid not null,
  topic_id uuid not null,
  source_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (topic_id, source_id),
  foreign key (topic_id, workspace_id) references public.topics(id, workspace_id) on delete cascade,
  foreign key (source_id, workspace_id) references public.sources(id, workspace_id) on delete cascade
);

create index categories_workspace_channel_idx on public.categories(workspace_id, channel_id);
create index sources_workspace_active_idx on public.sources(workspace_id, is_active);
create index source_categories_category_idx on public.source_categories(category_id);
create index topics_workspace_status_created_idx on public.topics(workspace_id, status, created_at desc);
create index topics_channel_category_idx on public.topics(channel_id, category_id);
create index topics_title_search_idx on public.topics using gin (to_tsvector('simple', title));
create index topic_sources_source_idx on public.topic_sources(source_id);

create or replace function private.set_updated_at()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger channels_set_updated_at before update on public.channels for each row execute function private.set_updated_at();
create trigger categories_set_updated_at before update on public.categories for each row execute function private.set_updated_at();
create trigger sources_set_updated_at before update on public.sources for each row execute function private.set_updated_at();
create trigger topics_set_updated_at before update on public.topics for each row execute function private.set_updated_at();

alter table public.categories enable row level security;
alter table public.sources enable row level security;
alter table public.source_categories enable row level security;
alter table public.topics enable row level security;
alter table public.topic_sources enable row level security;

create policy "Workspace members read categories" on public.categories for select to authenticated
  using (private.is_workspace_member(workspace_id));
create policy "Admins manage categories" on public.categories for all to authenticated
  using (private.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[]))
  with check (private.has_workspace_role(workspace_id, array['owner','admin']::public.workspace_role[]));

create policy "Workspace members read sources" on public.sources for select to authenticated
  using (private.is_workspace_member(workspace_id));
create policy "Editors manage sources" on public.sources for all to authenticated
  using (private.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]))
  with check (private.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]));

create policy "Workspace members read source categories" on public.source_categories for select to authenticated
  using (private.is_workspace_member(workspace_id));
create policy "Editors manage source categories" on public.source_categories for all to authenticated
  using (private.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]))
  with check (private.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]));

create policy "Workspace members read topics" on public.topics for select to authenticated
  using (private.is_workspace_member(workspace_id));
create policy "Editors manage topics" on public.topics for all to authenticated
  using (private.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]))
  with check (private.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]));

create policy "Workspace members read topic sources" on public.topic_sources for select to authenticated
  using (private.is_workspace_member(workspace_id));
create policy "Editors manage topic sources" on public.topic_sources for all to authenticated
  using (private.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]))
  with check (private.has_workspace_role(workspace_id, array['owner','admin','editor']::public.workspace_role[]));

grant select, insert, update, delete on public.categories, public.sources, public.source_categories,
  public.topics, public.topic_sources to authenticated;
grant usage on type public.source_type, public.topic_status to authenticated;

insert into public.categories (workspace_id, channel_id, name, slug, description)
select c.workspace_id, c.id, seed.name, seed.slug, seed.description
from public.channels c
cross join (values
  ('Criaturas das profundezas', 'criaturas-das-profundezas', 'Espécies adaptadas às regiões profundas do oceano.'),
  ('Tubarões e grandes predadores', 'tubaroes-e-grandes-predadores', 'Tubarões e outros grandes predadores marinhos.'),
  ('Polvos e lulas', 'polvos-e-lulas', 'Cefalópodes, comportamento e adaptações.'),
  ('Bioluminescência', 'bioluminescencia', 'Organismos e fenômenos de emissão de luz.'),
  ('Corais e ecossistemas marinhos', 'corais-e-ecossistemas-marinhos', 'Recifes, habitats e relações ecológicas.'),
  ('Curiosidades e recordes marinhos', 'curiosidades-e-recordes-marinhos', 'Fatos verificados e recordes da vida marinha.'),
  ('Descobertas científicas', 'descobertas-cientificas', 'Novas descobertas e estudos científicos.'),
  ('Fenômenos dos oceanos', 'fenomenos-dos-oceanos', 'Fenômenos físicos, químicos e biológicos oceânicos.')
) as seed(name, slug, description)
where c.slug = 'mergulho-curioso'
on conflict (channel_id, slug) do nothing;
