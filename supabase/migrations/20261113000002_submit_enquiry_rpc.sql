-- Contact form without the service key: a narrow, validated, rate-limited entry point the site calls with the
-- public anon key. It can only insert one enquiry; it can't read anything back. Per-visitor limit (5 / 10 min)
-- plus a site-wide cap (60 / hour) bound abuse even if someone calls it directly.
create or replace function public.submit_enquiry(
  p_kind text, p_name text, p_phone text, p_email text, p_company text, p_service text,
  p_message text, p_locale text, p_source text, p_ip_hash text, p_ua text
) returns uuid
language plpgsql security definer set search_path = ''
as $$
declare v_id uuid;
begin
  if p_kind not in ('contact', 'consultation') then raise exception 'invalid kind'; end if;
  if length(trim(coalesce(p_name, ''))) not between 2 and 120 then raise exception 'invalid name'; end if;
  if coalesce(p_phone, '') !~ '^\+?[0-9 ()-]{7,20}$' then raise exception 'invalid phone'; end if;
  if coalesce(p_email, '') <> '' and (length(p_email) > 200 or p_email !~ '^[^@\s]+@[^@\s]+\.[^@\s]+$') then raise exception 'invalid email'; end if;
  if length(trim(coalesce(p_message, ''))) not between 5 and 5000 then raise exception 'invalid message'; end if;
  if not public.hit_rate_limit('enquiry-rpc:' || left(coalesce(p_ip_hash, 'none'), 64), 5, 600) then raise exception 'rate limited'; end if;
  if not public.hit_rate_limit('enquiry-rpc:global', 60, 3600) then raise exception 'rate limited'; end if;
  insert into public.enquiries (kind, name, phone, email, company, service, message, locale, source_url, ip_hash, user_agent)
  values (p_kind, trim(p_name), trim(p_phone), nullif(trim(coalesce(p_email, '')), ''), nullif(left(trim(coalesce(p_company, '')), 160), ''),
          nullif(left(trim(coalesce(p_service, '')), 80), ''), trim(p_message), left(coalesce(p_locale, 'ar'), 10),
          left(coalesce(p_source, ''), 500), left(coalesce(p_ip_hash, ''), 64), left(coalesce(p_ua, ''), 300))
  returning id into v_id;
  return v_id;
end $$;
revoke all on function public.submit_enquiry(text, text, text, text, text, text, text, text, text, text, text) from public;
grant execute on function public.submit_enquiry(text, text, text, text, text, text, text, text, text, text, text) to anon, authenticated, service_role;
