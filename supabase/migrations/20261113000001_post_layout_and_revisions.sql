-- Blog: per-post reading layout and revision history.

alter table public.posts add column if not exists layout text not null default 'classic';
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'posts_layout_check') then
    alter table public.posts add constraint posts_layout_check check (layout in ('classic', 'feature', 'minimal'));
  end if;
end $$;

-- Revisions: the previous content is kept each time a post is saved with changes (not on autosaves).
create table if not exists public.post_versions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  snapshot jsonb not null,
  created_by uuid references auth.users (id) on delete set null default auth.uid(),
  created_at timestamptz not null default now()
);
create index if not exists post_versions_post_idx on public.post_versions (post_id, created_at desc);
create index if not exists post_versions_created_by_idx on public.post_versions (created_by);
alter table public.post_versions enable row level security;
drop policy if exists "staff read" on public.post_versions;
drop policy if exists "editors insert" on public.post_versions;
create policy "staff read" on public.post_versions for select to authenticated using (public.has_role('viewer'));
create policy "editors insert" on public.post_versions for insert to authenticated with check (public.has_role('editor'));

-- Keep the 20 newest revisions per post (database size guardrail, docs/GUARDRAILS.md §6).
create or replace function private.cap_post_versions()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  delete from public.post_versions v
  where v.post_id = new.post_id
    and v.id not in (select id from public.post_versions where post_id = new.post_id order by created_at desc limit 20);
  return null;
end $$;
drop trigger if exists cap_post_versions on public.post_versions;
create trigger cap_post_versions after insert on public.post_versions for each row execute function private.cap_post_versions();
