-- Indexes for foreign keys
create index if not exists enquiries_assigned_to_idx on public.enquiries (assigned_to);
create index if not exists enquiry_replies_enquiry_id_idx on public.enquiry_replies (enquiry_id);
create index if not exists enquiry_replies_sent_by_idx on public.enquiry_replies (sent_by);
create index if not exists invitations_invited_by_idx on public.invitations (invited_by);
create index if not exists posts_author_id_idx on public.posts (author_id);
create index if not exists posts_category_id_idx on public.posts (category_id);

-- auth.uid() evaluated once per query, not per row
drop policy if exists "self or staff read" on public.profiles;
drop policy if exists "self update name" on public.profiles;
create policy "self or staff read" on public.profiles for select to authenticated using (id = (select auth.uid()) or public.has_role('viewer'));
create policy "self update name" on public.profiles for update to authenticated using (id = (select auth.uid()) or public.has_role('admin')) with check (id = (select auth.uid()) or public.has_role('admin'));

-- One SELECT policy per table: split the "for all" write policies into insert/update/delete
do $$
declare t text;
begin
  foreach t in array array['post_categories','post_tags','authors','ui_strings']
  loop
    execute format('drop policy if exists "editors write" on public.%I', t);
    execute format('create policy "editors insert" on public.%I for insert to authenticated with check (public.has_role(''editor''))', t);
    execute format('create policy "editors update" on public.%I for update to authenticated using (public.has_role(''editor'')) with check (public.has_role(''editor''))', t);
    execute format('create policy "editors delete" on public.%I for delete to authenticated using (public.has_role(''editor''))', t);
  end loop;
  foreach t in array array['languages','menus','redirects','settings']
  loop
    execute format('drop policy if exists "admins write" on public.%I', t);
    execute format('create policy "admins insert" on public.%I for insert to authenticated with check (public.has_role(''admin''))', t);
    execute format('create policy "admins update" on public.%I for update to authenticated using (public.has_role(''admin'')) with check (public.has_role(''admin''))', t);
    execute format('create policy "admins delete" on public.%I for delete to authenticated using (public.has_role(''admin''))', t);
  end loop;
end $$;

drop policy if exists "editors write" on public.page_templates;
create policy "editors insert" on public.page_templates for insert to authenticated with check (public.has_role('editor'));
create policy "editors update" on public.page_templates for update to authenticated using (public.has_role('editor')) with check (public.has_role('editor'));
create policy "editors delete" on public.page_templates for delete to authenticated using (public.has_role('editor'));
