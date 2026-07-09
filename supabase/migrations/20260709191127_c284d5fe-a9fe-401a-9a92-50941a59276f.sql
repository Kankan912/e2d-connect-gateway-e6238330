
-- Lot 2.4.6 — CMS & site public

-- Tables publiques standards (SELECT public + write admin)
SELECT public._apply_tenant_rls(t, true, true, 'true') FROM unnest(ARRAY[
  'site_about','site_activities','site_events','site_gallery','site_gallery_albums',
  'site_hero','site_hero_images','site_partners',
  'cms_events','cms_gallery','cms_hero_slides','cms_pages','cms_partners','cms_sections'
]::text[]) AS t;

-- ============================================================
-- messages_contact : INSERT public gardé
-- ============================================================
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='messages_contact' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.messages_contact', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "messages_contact_public_insert" ON public.messages_contact
  FOR INSERT TO public
  WITH CHECK (statut = 'nouveau' AND length(message) >= 10);

CREATE POLICY "messages_contact_tenant_select" ON public.messages_contact
  FOR SELECT TO authenticated
  USING (public.is_admin_of(association_id) OR public.is_super_admin());

CREATE POLICY "messages_contact_tenant_update" ON public.messages_contact
  FOR UPDATE TO authenticated
  USING (public.is_admin_of(association_id) OR public.is_super_admin())
  WITH CHECK (public.is_admin_of(association_id) OR public.is_super_admin());

CREATE POLICY "messages_contact_tenant_delete" ON public.messages_contact
  FOR DELETE TO authenticated
  USING (public.is_admin_of(association_id) OR public.is_super_admin());

CREATE POLICY "messages_contact_service_all" ON public.messages_contact
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- site_pageviews : insert public, read admin
-- ============================================================
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='site_pageviews' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.site_pageviews', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "site_pageviews_public_insert" ON public.site_pageviews
  FOR INSERT TO public WITH CHECK (true);

CREATE POLICY "site_pageviews_admin_select" ON public.site_pageviews
  FOR SELECT TO authenticated
  USING (public.is_admin() OR public.is_super_admin());

CREATE POLICY "site_pageviews_service_all" ON public.site_pageviews
  FOR ALL TO service_role USING (true) WITH CHECK (true);
