-- Owner email used by the first-run setup (change here or in Supabase → SQL if the owner changes before first sign-in).
insert into private.app_config (key, value) values ('owner_email', 'scowebsite2026@gmail.com')
on conflict (key) do update set value = excluded.value;

-- Server-only check used by the owner setup screen: true only while no owner exists and the email is the configured one.
create or replace function public.owner_setup_allowed(p_email text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select not exists (select 1 from public.profiles where role = 'owner')
     and lower(trim(p_email)) = (select lower(value) from private.app_config where key = 'owner_email')
$$;
revoke all on function public.owner_setup_allowed(text) from public, anon, authenticated;
grant execute on function public.owner_setup_allowed(text) to service_role;
