
-- 1) Avatars: explicit public read (intentional — avatars displayed across the app)
DROP POLICY IF EXISTS "Public read access to avatars" ON storage.objects;
CREATE POLICY "Public read access to avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

-- 2) Course media: only assets referenced by a published course
DROP POLICY IF EXISTS "Public read of published course media" ON storage.objects;
CREATE POLICY "Public read of published course media"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'course-media'
  AND EXISTS (
    SELECT 1 FROM public.courses c
    WHERE c.is_published = true
      AND (
        c.image_url LIKE '%' || storage.objects.name || '%'
        OR storage.objects.name LIKE 'courses/' || c.id::text || '/%'
      )
  )
);

-- Admins can always read course-media (for editing unpublished assets)
DROP POLICY IF EXISTS "Admins read all course media" ON storage.objects;
CREATE POLICY "Admins read all course media"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'course-media'
  AND public.has_role(auth.uid(), 'admin')
);

-- 3) Remove subscriptions from realtime publication (prevents cross-tenant
--    channel subscription to billing data). Client switches to focus/interval polling.
ALTER PUBLICATION supabase_realtime DROP TABLE public.subscriptions;
