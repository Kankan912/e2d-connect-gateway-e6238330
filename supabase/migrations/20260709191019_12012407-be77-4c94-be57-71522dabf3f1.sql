
-- Lot 2.4.3 — Adhésions, réunions & sanctions

-- Standard admin_write pour tables métier
SELECT public._apply_tenant_rls(t) FROM unnest(ARRAY[
  'reunions','reunions_presences','reunions_sanctions',
  'sanctions','sanctions_types','types_sanctions',
  'rapports_seances'
]::text[]) AS t;

-- Enfants sans association_id
DO $$
DECLARE tbl text; r record;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['activites_membres','reunions_huile_savon']
  LOOP
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=tbl LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, tbl);
    END LOOP;
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)', tbl||'_select_auth', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.is_admin() OR public.is_super_admin()) WITH CHECK (public.is_admin() OR public.is_super_admin())', tbl||'_write_admin', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)', tbl||'_service_all', tbl);
  END LOOP;
END $$;

-- ============================================================
-- adhesions (INSERT public gardé)
-- ============================================================
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='adhesions' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.adhesions', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "adhesions_public_insert" ON public.adhesions
  FOR INSERT TO public
  WITH CHECK (
    payment_status = 'pending'
    AND processed = false
    AND montant_paye > 0
    AND type_adhesion = ANY (ARRAY['e2d','phoenix','e2d_phoenix'])
  );

CREATE POLICY "adhesions_tenant_select" ON public.adhesions
  FOR SELECT TO authenticated
  USING (public.is_admin_of(association_id) OR public.is_super_admin());

CREATE POLICY "adhesions_tenant_update" ON public.adhesions
  FOR UPDATE TO authenticated
  USING (public.is_admin_of(association_id) OR public.is_super_admin())
  WITH CHECK (public.is_admin_of(association_id) OR public.is_super_admin());

CREATE POLICY "adhesions_tenant_delete" ON public.adhesions
  FOR DELETE TO authenticated
  USING (public.is_admin_of(association_id) OR public.is_super_admin());

CREATE POLICY "adhesions_service_all" ON public.adhesions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- demandes_adhesion (INSERT public gardé)
-- ============================================================
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='demandes_adhesion' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.demandes_adhesion', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "demandes_adhesion_public_insert" ON public.demandes_adhesion
  FOR INSERT TO public
  WITH CHECK (
    statut = 'en_attente'
    AND type_adhesion = ANY (ARRAY['e2d','phoenix','e2d_phoenix'])
  );

CREATE POLICY "demandes_adhesion_tenant_select" ON public.demandes_adhesion
  FOR SELECT TO authenticated
  USING (public.is_admin_of(association_id) OR public.is_super_admin());

CREATE POLICY "demandes_adhesion_tenant_update" ON public.demandes_adhesion
  FOR UPDATE TO authenticated
  USING (public.is_admin_of(association_id) OR public.is_super_admin())
  WITH CHECK (public.is_admin_of(association_id) OR public.is_super_admin());

CREATE POLICY "demandes_adhesion_tenant_delete" ON public.demandes_adhesion
  FOR DELETE TO authenticated
  USING (public.is_admin_of(association_id) OR public.is_super_admin());

CREATE POLICY "demandes_adhesion_service_all" ON public.demandes_adhesion
  FOR ALL TO service_role USING (true) WITH CHECK (true);
