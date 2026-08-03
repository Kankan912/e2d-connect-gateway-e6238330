DROP POLICY IF EXISTS "site_images_insert_authenticated" ON storage.objects;
CREATE POLICY "site_images_insert_authenticated"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'site-images');

DROP POLICY IF EXISTS "site_images_update_authenticated" ON storage.objects;
CREATE POLICY "site_images_update_authenticated"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'site-images')
WITH CHECK (bucket_id = 'site-images');

DROP POLICY IF EXISTS "site_images_delete_authenticated" ON storage.objects;
CREATE POLICY "site_images_delete_authenticated"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'site-images');