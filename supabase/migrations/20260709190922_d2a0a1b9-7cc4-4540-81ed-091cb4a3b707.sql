
-- Lot 2.4.5 — Config tables tenant-aware

-- Tables avec association_id NOT NULL : patron standard admin_write
SELECT public._apply_tenant_rls(t) FROM unnest(ARRAY[
  'association_settings','caisse_config','prets_config','payment_configs','smtp_config',
  'notifications_config','session_config','sanctions_tarifs','beneficiaires_config',
  'match_gala_config','sport_e2d_config','sport_phoenix_config','tontine_configurations',
  'exercices','exercices_cotisations_types'
]::text[]) AS t;

-- Config CMS / site (SELECT public autorisé)
SELECT public._apply_tenant_rls(t, true, true, 'true') FROM unnest(ARRAY[
  'cms_settings','site_config','site_events_carousel_config'
]::text[]) AS t;

-- ============================================================
-- platform_settings : super_admin uniquement
-- ============================================================
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='platform_settings' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.platform_settings', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "platform_settings_super_admin_all" ON public.platform_settings
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "platform_settings_service_all" ON public.platform_settings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "platform_settings_read_authenticated" ON public.platform_settings
  FOR SELECT TO authenticated USING (true);

-- ============================================================
-- Configurations "globales" (pas d'association_id) — lecture auth, écriture admin
-- ============================================================
DO $$
DECLARE
  tbl text;
  r record;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['loan_validation_config','pret_reconduction_validation_config','configurations']
  LOOP
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=tbl LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, tbl);
    END LOOP;

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)',
      tbl || '_select_auth', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.is_admin() OR public.is_super_admin()) WITH CHECK (public.is_admin() OR public.is_super_admin())',
      tbl || '_write_admin', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
      tbl || '_service_all', tbl
    );
  END LOOP;
END $$;
