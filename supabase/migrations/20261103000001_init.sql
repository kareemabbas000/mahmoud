-- SCO website — initial schema, roles, RLS, audit, storage.
-- All content is localized JSONB keyed by language code ({"ar": "...", "en": "..."}), so languages stay data.

create extension if not exists pgcrypto with schema extensions;

-- ───────────────────────── Roles & profiles ─────────────────────────
-- Declared low → high so enum comparison expresses privilege (role >= 'editor').
create type public.app_role as enum ('viewer', 'editor', 'admin', 'owner');

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

-- Server-side configuration (e.g. owner_email). Not exposed through the API.
create table private.app_config (
  key text primary key,
  value text not null
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text,
  role public.app_role not null default 'viewer',
  ui_locale text not null default 'ar',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.current_app_role()
returns public.app_role
language sql stable security definer set search_path = ''
as $$ select role from public.profiles where id = auth.uid() $$;

create or replace function public.has_role(min_role public.app_role)
returns boolean
language sql stable security definer set search_path = ''
as $$ select coalesce((select role >= min_role from public.profiles where id = auth.uid()), false) $$;

grant execute on function public.has_role(public.app_role) to anon, authenticated;
grant execute on function public.current_app_role() to authenticated;

create table public.invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  role public.app_role not null check (role <> 'owner'),
  token_hash text not null unique,
  invited_by uuid references auth.users (id) on delete set null,
  expires_at timestamptz not null default now() + interval '7 days',
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);
create index on public.invitations (lower(email));

-- New auth user → profile. The configured owner email becomes owner (once); invited emails get their invited role.
create or replace function private.handle_new_user()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_owner text;
  v_role public.app_role := 'viewer';
  v_inv public.invitations;
begin
  select value into v_owner from private.app_config where key = 'owner_email';
  if v_owner is not null and lower(new.email) = lower(v_owner)
     and not exists (select 1 from public.profiles where role = 'owner') then
    v_role := 'owner';
  else
    select * into v_inv from public.invitations
      where lower(email) = lower(new.email) and accepted_at is null and revoked_at is null and expires_at > now()
      order by created_at desc limit 1;
    if found then
      v_role := v_inv.role;
      update public.invitations set accepted_at = now() where id = v_inv.id;
    end if;
  end if;
  insert into public.profiles (id, email, role) values (new.id, new.email, v_role)
  on conflict (id) do nothing;
  return new;
end $$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

-- Only the owner can grant/revoke ownership or edit the owner's profile; admins manage everyone else.
create or replace function private.guard_profile_roles()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_actor public.app_role := (select role from public.profiles where id = auth.uid());
begin
  if auth.uid() is null then return coalesce(new, old); end if; -- service role / SQL
  if tg_op = 'UPDATE' then
    if new.id = auth.uid() and new.role <> old.role then
      raise exception 'You cannot change your own role';
    end if;
    if (old.role = 'owner' or new.role = 'owner') and v_actor <> 'owner' then
      raise exception 'Only the owner can change ownership';
    end if;
    if new.role <> old.role and v_actor < 'admin' then
      raise exception 'Only admins can change roles';
    end if;
  end if;
  if tg_op = 'DELETE' and old.role = 'owner' then
    raise exception 'The owner profile cannot be deleted';
  end if;
  return coalesce(new, old);
end $$;

create trigger guard_profile_roles
before update or delete on public.profiles
for each row execute function private.guard_profile_roles();

-- ───────────────────────── Audit log ─────────────────────────
create table public.audit_log (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor uuid,
  actor_email text,
  action text not null,
  entity text not null,
  entity_id text,
  diff jsonb
);
create index on public.audit_log (at desc);
create index on public.audit_log (entity, entity_id);

create or replace function private.audit()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_old jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  v_new jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;
  v_changed jsonb;
  v_id text;
begin
  v_id := coalesce(v_new ->> 'id', v_old ->> 'id', v_new ->> 'key', v_old ->> 'key', v_new ->> 'code', v_old ->> 'code', v_new ->> 'location', v_old ->> 'location');
  if tg_op = 'UPDATE' then
    select jsonb_object_agg(k, jsonb_build_object('old', v_old -> k, 'new', v_new -> k)) into v_changed
    from jsonb_object_keys(v_new) k
    where (v_new -> k) is distinct from (v_old -> k) and k not in ('updated_at');
    if v_changed is null then return new; end if;
  end if;
  insert into public.audit_log (actor, actor_email, action, entity, entity_id, diff)
  values (
    auth.uid(),
    (select email from public.profiles where id = auth.uid()),
    lower(tg_op),
    tg_table_name,
    v_id,
    case tg_op when 'UPDATE' then v_changed when 'INSERT' then v_new else v_old end
  );
  return coalesce(new, old);
end $$;

create or replace function private.touch()
returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at := now(); return new; end $$;

-- ───────────────────────── Languages, settings, texts ─────────────────────────
create table public.languages (
  code text primary key check (code ~ '^[a-z]{2,3}(-[A-Za-z]{2,4})?$'),
  name text not null,
  native_name text not null,
  dir text not null default 'ltr' check (dir in ('ltr', 'rtl')),
  enabled boolean not null default false,
  is_default boolean not null default false,
  sort int not null default 100,
  updated_at timestamptz not null default now()
);
create unique index languages_one_default on public.languages (is_default) where is_default;

create table public.settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid()
);

create table public.ui_strings (
  key text primary key,
  "values" jsonb not null default '{}'::jsonb,
  "group" text generated always as (split_part(key, '.', 1)) stored,
  updated_at timestamptz not null default now()
);

create table public.menus (
  location text primary key check (location in ('header', 'footer')),
  items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now()
);

-- ───────────────────────── Pages & builder ─────────────────────────
create table public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:[-/][a-z0-9]+)*$' or slug = ''),
  kind text not null default 'custom' check (kind in ('system', 'custom')),
  published boolean not null default false,
  title jsonb not null default '{}'::jsonb,
  seo jsonb not null default '{}'::jsonb,
  blocks jsonb not null default '[]'::jsonb,
  draft jsonb,                      -- {title, seo, blocks} autosaved, unpublished
  draft_updated_at timestamptz,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  updated_by uuid default auth.uid()
);

create table public.page_versions (
  id uuid primary key default gen_random_uuid(),
  page_id uuid not null references public.pages (id) on delete cascade,
  snapshot jsonb not null,
  note text,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);
create index on public.page_versions (page_id, created_at desc);

create table public.page_templates (
  id uuid primary key default gen_random_uuid(),
  name jsonb not null,
  blocks jsonb not null default '[]'::jsonb,
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now()
);

-- ───────────────────────── Collections ─────────────────────────
create table public.services (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  legacy_slug text,
  sort int not null default 100,
  published boolean not null default true,
  icon text not null default 'spark',
  image text,
  name jsonb not null default '{}'::jsonb,
  summary jsonb not null default '{}'::jsonb,
  intro jsonb not null default '{}'::jsonb,
  body jsonb not null default '{}'::jsonb,
  highlights jsonb not null default '{}'::jsonb,
  seo jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  sort int not null default 100,
  published boolean not null default true,
  has_profile boolean not null default false,
  name jsonb not null default '{}'::jsonb,
  role jsonb not null default '{}'::jsonb,
  credentials jsonb not null default '{}'::jsonb,
  bio jsonb not null default '{}'::jsonb,
  photo text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  kind text not null default 'corporate' check (kind in ('corporate', 'donor', 'ngo')),
  sort int not null default 100,
  published boolean not null default true,
  featured boolean not null default false,
  name jsonb not null default '{}'::jsonb,
  logo text,
  url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.certificates (
  id uuid primary key default gen_random_uuid(),
  sort int not null default 100,
  published boolean not null default true,
  title jsonb not null default '{}'::jsonb,
  issuer jsonb not null default '{}'::jsonb,
  reference text,
  year int,
  image text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.branches (
  id uuid primary key default gen_random_uuid(),
  sort int not null default 100,
  published boolean not null default true,
  is_primary boolean not null default false,
  name jsonb not null default '{}'::jsonb,
  address jsonb not null default '{}'::jsonb,
  landmark jsonb not null default '{}'::jsonb,
  phones text[] not null default '{}',
  email text,
  hours jsonb not null default '{}'::jsonb,
  lat double precision,
  lng double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  group_key text not null default 'general',
  sort int not null default 100,
  published boolean not null default true,
  question jsonb not null default '{}'::jsonb,
  answer jsonb not null default '{}'::jsonb,
  legal_basis jsonb,
  reviewed_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.gallery_items (
  id uuid primary key default gen_random_uuid(),
  sort int not null default 100,
  published boolean not null default true,
  image text not null,
  width int not null default 1200,
  height int not null default 800,
  caption jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ───────────────────────── Insights ─────────────────────────
create table public.post_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table public.post_tags (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
create table public.authors (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name jsonb not null default '{}'::jsonb,
  bio jsonb not null default '{}'::jsonb,
  photo text,
  team_slug text,
  updated_at timestamptz not null default now()
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  slug jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'scheduled', 'published')),
  publish_at timestamptz,
  title jsonb not null default '{}'::jsonb,
  excerpt jsonb not null default '{}'::jsonb,
  body jsonb not null default '{}'::jsonb,
  cover text,
  cover_alt jsonb not null default '{}'::jsonb,
  category_id uuid references public.post_categories (id) on delete set null,
  tag_ids uuid[] not null default '{}',
  author_id uuid references public.authors (id) on delete set null,
  seo jsonb not null default '{}'::jsonb,
  faqs jsonb not null default '{}'::jsonb,
  source_hash text,                         -- hash of the source-language content at last edit
  translation_status jsonb not null default '{}'::jsonb, -- {en: "current"|"outdated"|"missing"}
  translated_from_hash jsonb not null default '{}'::jsonb, -- {en: <source_hash when translated>}
  created_by uuid default auth.uid(),
  updated_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'published' or publish_at is not null)
);
create index on public.posts (status, publish_at desc);

-- ───────────────────────── Media ─────────────────────────
create table public.media (
  id uuid primary key default gen_random_uuid(),
  bucket text not null default 'media',
  path text not null,
  url text not null,
  mime text,
  size int,
  width int,
  height int,
  alt jsonb not null default '{}'::jsonb,
  folder text not null default 'general',
  created_by uuid default auth.uid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (bucket, path)
);

-- ───────────────────────── Enquiries & newsletter ─────────────────────────
create table public.enquiries (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('contact', 'consultation', 'career')),
  status text not null default 'new' check (status in ('new', 'in_progress', 'replied', 'closed', 'spam')),
  name text not null,
  phone text,
  email text,
  company text,
  service text,
  job_title text,
  message text,
  cv_path text,
  locale text,
  source_url text,
  ip_hash text,
  user_agent text,
  assigned_to uuid references auth.users (id) on delete set null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.enquiries (status, created_at desc);

create table public.enquiry_replies (
  id uuid primary key default gen_random_uuid(),
  enquiry_id uuid not null references public.enquiries (id) on delete cascade,
  subject text not null,
  body text not null,
  sent_by uuid default auth.uid() references auth.users (id) on delete set null,
  delivery text not null default 'sent' check (delivery in ('sent', 'failed', 'logged')),
  provider_id text,
  error text,
  created_at timestamptz not null default now()
);

create table public.newsletter_subscribers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  locale text not null default 'ar',
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'unsubscribed')),
  confirm_token text unique,
  unsubscribe_token text unique,
  ip_hash text,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.redirects (
  id uuid primary key default gen_random_uuid(),
  source text not null unique check (source like '/%'),
  destination text not null,
  status int not null default 301 check (status in (301, 302, 307, 308)),
  enabled boolean not null default true,
  note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ───────────────────────── Rate limiting (server only) ─────────────────────────
create table private.rate_limits (
  key text primary key,
  window_start timestamptz not null default now(),
  count int not null default 0
);

create or replace function public.hit_rate_limit(p_key text, p_limit int, p_window_seconds int)
returns boolean
language plpgsql security definer set search_path = ''
as $$
declare v_count int;
begin
  insert into private.rate_limits as r (key, window_start, count)
  values (p_key, now(), 1)
  on conflict (key) do update
    set count = case when r.window_start < now() - make_interval(secs => p_window_seconds) then 1 else r.count + 1 end,
        window_start = case when r.window_start < now() - make_interval(secs => p_window_seconds) then now() else r.window_start end
  returning count into v_count;
  return v_count <= p_limit;
end $$;
revoke all on function public.hit_rate_limit(text, int, int) from public, anon, authenticated;
grant execute on function public.hit_rate_limit(text, int, int) to service_role;

-- ───────────────────────── Triggers: updated_at + audit ─────────────────────────
do $$
declare t text;
begin
  foreach t in array array['profiles','languages','settings','ui_strings','menus','pages','services','team_members','clients','certificates','branches','faqs','gallery_items','post_categories','post_tags','authors','posts','media','enquiries','newsletter_subscribers','redirects']
  loop
    execute format('create trigger touch_%1$s before update on public.%1$I for each row execute function private.touch()', t);
  end loop;
  foreach t in array array['profiles','invitations','languages','settings','ui_strings','menus','pages','page_templates','services','team_members','clients','certificates','branches','faqs','gallery_items','post_categories','post_tags','authors','posts','media','enquiries','enquiry_replies','redirects']
  loop
    execute format('create trigger audit_%1$s after insert or update or delete on public.%1$I for each row execute function private.audit()', t);
  end loop;
end $$;

-- ───────────────────────── Row-level security ─────────────────────────
do $$
declare t text;
begin
  foreach t in array array['profiles','invitations','audit_log','languages','settings','ui_strings','menus','pages','page_versions','page_templates','services','team_members','clients','certificates','branches','faqs','gallery_items','post_categories','post_tags','authors','posts','media','enquiries','enquiry_replies','newsletter_subscribers','redirects']
  loop
    execute format('alter table public.%I enable row level security', t);
  end loop;
end $$;

-- Public content: anyone can read published rows; staff (viewer+) read everything; editors write.
do $$
declare t text;
begin
  foreach t in array array['services','team_members','clients','certificates','branches','faqs','gallery_items']
  loop
    execute format('create policy "public read published" on public.%I for select to anon, authenticated using (published or public.has_role(''viewer''))', t);
    execute format('create policy "editors insert" on public.%I for insert to authenticated with check (public.has_role(''editor''))', t);
    execute format('create policy "editors update" on public.%I for update to authenticated using (public.has_role(''editor'')) with check (public.has_role(''editor''))', t);
    execute format('create policy "admins delete" on public.%I for delete to authenticated using (public.has_role(''admin''))', t);
  end loop;
  foreach t in array array['post_categories','post_tags','authors','ui_strings']
  loop
    execute format('create policy "public read" on public.%I for select to anon, authenticated using (true)', t);
    execute format('create policy "editors write" on public.%I for all to authenticated using (public.has_role(''editor'')) with check (public.has_role(''editor''))', t);
  end loop;
  foreach t in array array['languages','menus','redirects']
  loop
    execute format('create policy "public read" on public.%I for select to anon, authenticated using (true)', t);
    execute format('create policy "admins write" on public.%I for all to authenticated using (public.has_role(''admin'')) with check (public.has_role(''admin''))', t);
  end loop;
end $$;

create policy "public read published" on public.pages for select to anon, authenticated using (published or public.has_role('viewer'));
create policy "editors insert" on public.pages for insert to authenticated with check (public.has_role('editor'));
create policy "editors update" on public.pages for update to authenticated using (public.has_role('editor')) with check (public.has_role('editor'));
create policy "admins delete custom pages" on public.pages for delete to authenticated using (public.has_role('admin') and kind = 'custom');

create policy "staff read" on public.page_versions for select to authenticated using (public.has_role('viewer'));
create policy "editors insert" on public.page_versions for insert to authenticated with check (public.has_role('editor'));
create policy "staff read" on public.page_templates for select to authenticated using (public.has_role('viewer'));
create policy "editors write" on public.page_templates for all to authenticated using (public.has_role('editor')) with check (public.has_role('editor'));

create policy "public read live posts" on public.posts for select to anon, authenticated
  using ((status in ('published', 'scheduled') and publish_at <= now()) or public.has_role('viewer'));
create policy "editors insert" on public.posts for insert to authenticated with check (public.has_role('editor'));
create policy "editors update" on public.posts for update to authenticated using (public.has_role('editor')) with check (public.has_role('editor'));
create policy "admins delete" on public.posts for delete to authenticated using (public.has_role('admin'));

-- Settings: site/tracking IDs are rendered publicly anyway; only admins change them.
create policy "public read public keys" on public.settings for select to anon, authenticated
  using (key in ('site', 'tracking', 'services_also_offered') or public.has_role('viewer'));
create policy "admins write" on public.settings for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));

create policy "staff read" on public.media for select to authenticated using (public.has_role('viewer'));
create policy "editors write" on public.media for insert to authenticated with check (public.has_role('editor'));
create policy "editors update" on public.media for update to authenticated using (public.has_role('editor')) with check (public.has_role('editor'));
create policy "editors delete" on public.media for delete to authenticated using (public.has_role('editor'));

-- Enquiries: inserted only by the server (service role) after validation + rate limiting.
create policy "staff read" on public.enquiries for select to authenticated using (public.has_role('viewer'));
create policy "editors update" on public.enquiries for update to authenticated using (public.has_role('editor')) with check (public.has_role('editor'));
create policy "admins delete" on public.enquiries for delete to authenticated using (public.has_role('admin'));
create policy "staff read" on public.enquiry_replies for select to authenticated using (public.has_role('viewer'));
create policy "editors insert" on public.enquiry_replies for insert to authenticated with check (public.has_role('editor'));

create policy "staff read" on public.newsletter_subscribers for select to authenticated using (public.has_role('viewer'));
create policy "admins update" on public.newsletter_subscribers for update to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));
create policy "admins delete" on public.newsletter_subscribers for delete to authenticated using (public.has_role('admin'));

create policy "self or staff read" on public.profiles for select to authenticated using (id = auth.uid() or public.has_role('viewer'));
create policy "self update name" on public.profiles for update to authenticated using (id = auth.uid() or public.has_role('admin')) with check (id = auth.uid() or public.has_role('admin'));
create policy "admins delete" on public.profiles for delete to authenticated using (public.has_role('admin'));

create policy "admins manage" on public.invitations for all to authenticated using (public.has_role('admin')) with check (public.has_role('admin'));
create policy "admins read" on public.audit_log for select to authenticated using (public.has_role('admin'));

-- ───────────────────────── Storage ─────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('media', 'media', true, 10485760, array['image/jpeg','image/png','image/webp','image/avif','image/svg+xml','image/gif','application/pdf']),
  ('cvs', 'cvs', false, 5242880, array['application/pdf','application/msword','application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do nothing;

create policy "media public read" on storage.objects for select to anon, authenticated using (bucket_id = 'media');
create policy "media editors write" on storage.objects for insert to authenticated with check (bucket_id = 'media' and public.has_role('editor'));
create policy "media editors update" on storage.objects for update to authenticated using (bucket_id = 'media' and public.has_role('editor'));
create policy "media editors delete" on storage.objects for delete to authenticated using (bucket_id = 'media' and public.has_role('editor'));
-- CVs: uploaded by the server (service role); readable by editors and above through signed URLs.
create policy "cvs editors read" on storage.objects for select to authenticated using (bucket_id = 'cvs' and public.has_role('editor'));
