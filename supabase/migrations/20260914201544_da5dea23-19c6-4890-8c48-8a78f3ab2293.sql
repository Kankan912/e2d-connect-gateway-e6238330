-- Écriture générique sur site-images : tout sauf le dossier réservé logos/
DROP POLICY IF EXISTS site_images_insert_authenticated ON storage.objects;
DROP POLICY IF EXISTS site_images_update_authenticated ON storage.objects;
DROP POLICY IF EXISTS site_images_delete_authenticated ON storage.objects;

CREATE POLICY site_images_insert_authenticated ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'site-images' AND (storage.foldername(name))[1] IS DISTINCT FROM 'logos');

CREATE POLICY site_images_update_authenticated ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'site-images' AND (storage.foldername(name))[1] IS DISTINCT FROM 'logos')
  WITH CHECK (bucket_id = 'site-images' AND (storage.foldername(name))[1] IS DISTINCT FROM 'logos');

CREATE POLICY site_images_delete_authenticated ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'site-images' AND (storage.foldername(name))[1] IS DISTINCT FROM 'logos');

-- Dossier réservé logos/ : écriture limitée aux administrateurs
CREATE POLICY site_images_logos_insert_admin ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'site-images'
    AND (storage.foldername(name))[1] = 'logos'
    AND (public.is_admin() OR public.has_permission('associations', 'write'))
  );

CREATE POLICY site_images_logos_update_admin ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'site-images'
    AND (storage.foldername(name))[1] = 'logos'
    AND (public.is_admin() OR public.has_permission('associations', 'write'))
  )
  WITH CHECK (
    bucket_id = 'site-images'
    AND (storage.foldername(name))[1] = 'logos'
    AND (public.is_admin() OR public.has_permission('associations', 'write'))
  );

CREATE POLICY site_images_logos_delete_admin ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'site-images'
    AND (storage.foldername(name))[1] = 'logos'
    AND (public.is_admin() OR public.has_permission('associations', 'write'))
  );
