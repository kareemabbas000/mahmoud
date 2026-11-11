-- Related posts are chosen when a post is saved, so a post page never depends on the full post list.
alter table public.posts add column if not exists related_ids uuid[] not null default '{}';

-- Scheduled publishing also refreshes the post's slug lookups (tags must match src/lib/tags.ts).
create or replace function private.publish_due_posts()
returns void
language plpgsql security definer set search_path = ''
as $$
declare v_tags text[];
begin
  with due as (
    update public.posts set status = 'published'
    where status = 'scheduled' and publish_at <= now()
    returning id, slug
  )
  select array_agg(distinct t) into v_tags from (
    select 'post:' || id::text as t from due
    union all
    select left('slug:' || s.value, 250) from due, jsonb_each_text(due.slug) s where s.value <> ''
  ) x;
  if v_tags is not null then
    perform private.revalidate(array['posts:index'] || v_tags);
  end if;
end $$;
revoke all on function private.publish_due_posts() from public, anon, authenticated;
