-- Cost & growth guardrails (see docs/GUARDRAILS.md).
-- Goal: the database stays far below the Free plan's 500 MB and every scheduled job runs inside Postgres
-- (pg_cron) so Vercel is only called when something actually changed.

-- ───────────── 1. Audit log: no draft autosaves, no oversized diffs ─────────────
-- Page-builder autosaves rewrite pages.draft every ~1 s while someone edits; logging the full old/new
-- draft each time would grow audit_log by megabytes per session. Drafts are working copies, so they
-- are never audited. Any diff larger than 32 kB is reduced to the list of changed keys.
create or replace function private.audit()
returns trigger
language plpgsql security definer set search_path = ''
as $$
declare
  v_skip text[] := array['updated_at', 'draft', 'draft_updated_at', 'updated_by'];
  v_old jsonb := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) - v_skip end;
  v_new jsonb := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) - v_skip end;
  v_diff jsonb;
  v_id text;
begin
  v_id := coalesce(v_new ->> 'id', v_old ->> 'id', v_new ->> 'key', v_old ->> 'key', v_new ->> 'code', v_old ->> 'code', v_new ->> 'location', v_old ->> 'location');
  if tg_op = 'UPDATE' then
    select jsonb_object_agg(k, jsonb_build_object('old', v_old -> k, 'new', v_new -> k)) into v_diff
    from jsonb_object_keys(v_new) k
    where (v_new -> k) is distinct from (v_old -> k);
    if v_diff is null then return new; end if; -- nothing but drafts/timestamps changed
  else
    v_diff := coalesce(v_new, v_old);
  end if;
  if pg_column_size(v_diff) > 32768 then
    v_diff := jsonb_build_object('_truncated', true, 'keys', (select jsonb_agg(k) from jsonb_object_keys(v_diff) k));
  end if;
  insert into public.audit_log (actor, actor_email, action, entity, entity_id, diff)
  values (auth.uid(), (select email from public.profiles where id = auth.uid()), lower(tg_op), tg_table_name, v_id, v_diff);
  return coalesce(new, old);
end $$;

-- ───────────── 2. Page versions: keep the 25 newest per page ─────────────
create or replace function private.cap_page_versions()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  delete from public.page_versions v
  where v.page_id = new.page_id
    and v.id not in (select id from public.page_versions where page_id = new.page_id order by created_at desc limit 25);
  return null;
end $$;
drop trigger if exists cap_page_versions on public.page_versions;
create trigger cap_page_versions after insert on public.page_versions for each row execute function private.cap_page_versions();

-- ───────────── 3. Posts: reading time stored at save time ─────────────
-- Lets list pages, cards and feeds skip loading post bodies entirely.
alter table public.posts add column if not exists read_minutes jsonb not null default '{}'::jsonb;

-- ───────────── 4. On-demand revalidation from the database ─────────────
create extension if not exists pg_net with schema extensions;
create extension if not exists pg_cron;

-- Shared secret the site checks on /api/revalidate (read server-side with the service key; never public).
insert into private.app_config (key, value)
values ('revalidate_secret', replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', ''))
on conflict (key) do nothing;
-- Deployments to notify (comma-separated origins). Edit with SQL when the domain changes.
insert into private.app_config (key, value)
values ('site_urls', 'https://scowebsite2026.vercel.app,https://sco-test.vercel.app')
on conflict (key) do nothing;

create or replace function public.revalidate_secret_ok(p_secret text)
returns boolean
language sql stable security definer set search_path = ''
as $$ select coalesce(length(p_secret) >= 32 and p_secret = (select value from private.app_config where key = 'revalidate_secret'), false) $$;
revoke all on function public.revalidate_secret_ok(text) from public, anon, authenticated;
grant execute on function public.revalidate_secret_ok(text) to service_role;

-- Ask every deployment to drop the given cache tags (async, fire-and-forget via pg_net).
create or replace function private.revalidate(p_tags text[])
returns void
language plpgsql security definer set search_path = ''
as $$
declare
  v_secret text := (select value from private.app_config where key = 'revalidate_secret');
  v_url text;
begin
  if p_tags is null or cardinality(p_tags) = 0 then return; end if;
  for v_url in select trim(u) from unnest(string_to_array((select value from private.app_config where key = 'site_urls'), ',')) u where trim(u) <> ''
  loop
    perform net.http_post(
      url := v_url || '/api/revalidate',
      body := jsonb_build_object('tags', to_jsonb(p_tags)),
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-revalidate-secret', v_secret),
      timeout_milliseconds := 5000
    );
  end loop;
end $$;
revoke all on function private.revalidate(text[]) from public, anon, authenticated;

-- ───────────── 5. Scheduled posts go live on time, with zero polling of Vercel ─────────────
-- Runs every minute inside Postgres. Only when a post's time has come does it flip the status and
-- send one revalidation request per deployment.
create or replace function private.publish_due_posts()
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_ids uuid[];
begin
  with due as (
    update public.posts set status = 'published'
    where status = 'scheduled' and publish_at <= now()
    returning id
  ) select array_agg(id) into v_ids from due;
  if v_ids is not null then
    perform private.revalidate(array['posts:index'] || (select array_agg('post:' || x) from unnest(v_ids) x));
  end if;
end $$;
revoke all on function private.publish_due_posts() from public, anon, authenticated;

-- ───────────── 6. Housekeeping ─────────────
create or replace function private.housekeeping()
returns void
language plpgsql security definer set search_path = ''
as $$
begin
  delete from private.rate_limits where window_start < now() - interval '2 days';
  delete from public.audit_log where at < now() - interval '400 days';
  delete from public.invitations where (accepted_at is not null or revoked_at is not null or expires_at < now()) and created_at < now() - interval '90 days';
  delete from public.newsletter_subscribers where status = 'pending' and created_at < now() - interval '30 days';
end $$;
revoke all on function private.housekeeping() from public, anon, authenticated;

do $$ begin
  perform cron.unschedule(jobname) from cron.job where jobname in ('sco-publish-due-posts', 'sco-housekeeping', 'sco-cron-history');
end $$;
select cron.schedule('sco-publish-due-posts', '* * * * *', 'select private.publish_due_posts()');
select cron.schedule('sco-housekeeping', '17 3 * * *', 'select private.housekeeping()');
-- pg_cron's own run history grows by ~1,500 rows a day; keep one week.
select cron.schedule('sco-cron-history', '27 3 * * *', $$delete from cron.job_run_details where end_time < now() - interval '7 days'$$);
