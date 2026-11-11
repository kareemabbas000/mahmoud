-- Security advisor fix: enable RLS on the private tables as defence in depth.
-- anon/authenticated already have no table privileges here; with RLS on and no policies,
-- even an accidental future GRANT exposes nothing. The SECURITY DEFINER functions that use
-- these tables (hit_rate_limit, owner_setup_allowed, handle_new_user) run as the table owner
-- (postgres, RLS not forced), so they keep working unchanged.
alter table private.app_config enable row level security;
alter table private.rate_limits enable row level security;
