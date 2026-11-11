-- A public bucket serves files by URL without any SELECT policy. The old anon SELECT policy only added the
-- ability to LIST every object in the bucket through the API; staff keep listing access for the panel.
drop policy if exists "media public read" on storage.objects;
create policy "media staff read" on storage.objects for select to authenticated using (bucket_id = 'media' and public.has_role('viewer'));
