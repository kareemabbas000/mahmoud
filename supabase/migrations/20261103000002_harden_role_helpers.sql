-- Advisor follow-up: current_app_role() is only for signed-in staff; anon never needs it.
-- has_role() stays executable by anon/authenticated on purpose: RLS policies evaluate it as the caller,
-- and it only returns whether the *caller* holds a role (no data about anyone else).
revoke execute on function public.current_app_role() from anon, public;
grant execute on function public.current_app_role() to authenticated;
comment on function public.has_role(public.app_role) is 'RLS helper: true when the calling user has at least the given role. Intentionally executable by anon (returns false).';
