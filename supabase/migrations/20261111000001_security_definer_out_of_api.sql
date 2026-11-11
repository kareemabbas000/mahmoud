-- Security advisor fix: no SECURITY DEFINER function stays callable through the public API.
-- The privileged role lookups live in the non-exposed `private` schema; the public names become
-- SECURITY INVOKER wrappers, so every existing RLS policy keeps working unchanged.

create or replace function private.has_role(min_role public.app_role)
returns boolean
language sql stable security definer set search_path = ''
as $$ select coalesce((select role >= min_role from public.profiles where id = auth.uid()), false) $$;

create or replace function private.current_app_role()
returns public.app_role
language sql stable security definer set search_path = ''
as $$ select role from public.profiles where id = auth.uid() $$;

-- RLS policies run as the caller, so anon/authenticated need to reach the helpers (not the rest of private).
grant usage on schema private to anon, authenticated;
revoke all on all functions in schema private from public, anon, authenticated;
revoke all on all tables in schema private from public, anon, authenticated;
grant execute on function private.has_role(public.app_role) to anon, authenticated, service_role;
grant execute on function private.current_app_role() to authenticated, service_role;
alter default privileges in schema private revoke execute on functions from public;

create or replace function public.has_role(min_role public.app_role)
returns boolean
language sql stable security invoker set search_path = ''
as $$ select private.has_role(min_role) $$;

create or replace function public.current_app_role()
returns public.app_role
language sql stable security invoker set search_path = ''
as $$ select private.current_app_role() $$;

alter function public.has_role(public.app_role) security invoker;
alter function public.current_app_role() security invoker;
comment on function public.has_role(public.app_role) is 'RLS helper (invoker wrapper around private.has_role): true when the caller holds at least the given role.';

-- Supabase's own event-trigger helper (present on new projects): nobody needs to call it via the API.
do $$ begin
  if exists (select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace where n.nspname = 'public' and p.proname = 'rls_auto_enable') then
    revoke execute on function public.rls_auto_enable() from public, anon, authenticated;
  end if;
end $$;
