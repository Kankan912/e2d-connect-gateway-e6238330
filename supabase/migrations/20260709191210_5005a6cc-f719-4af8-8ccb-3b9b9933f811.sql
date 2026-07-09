
-- Lot 2.4.7 — Audit, notifications & logs

-- ============================================================
-- notifications : own + admin
-- ============================================================
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='notifications' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.notifications', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "notifications_select_own_or_admin" ON public.notifications
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_super_admin()
    OR (association_id IS NOT NULL AND public.is_admin_of(association_id))
  );

CREATE POLICY "notifications_update_own" ON public.notifications
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "notifications_insert_admin_or_self" ON public.notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    OR public.is_super_admin()
    OR (association_id IS NOT NULL AND public.is_admin_of(association_id))
  );

CREATE POLICY "notifications_delete_admin" ON public.notifications
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR (association_id IS NOT NULL AND public.is_admin_of(association_id))
  );

CREATE POLICY "notifications_service_all" ON public.notifications
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ============================================================
-- Tables avec association_id NOT NULL : patron admin_write
-- ============================================================
SELECT public._apply_tenant_rls(t) FROM unnest(ARRAY[
  'notifications_campagnes','notifications_envois','notifications_historique',
  'notifications_logs','notifications_templates',
  'alertes_budgetaires','exports_programmes','fichiers_joint'
]::text[]) AS t;

-- ============================================================
-- audit_logs, email_logs : nullable association_id, lecture admin
-- ============================================================
DO $$
DECLARE tbl text; r record;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['audit_logs','email_logs']
  LOOP
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=tbl LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, tbl);
    END LOOP;

    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (public.is_super_admin() OR (association_id IS NOT NULL AND public.is_admin_of(association_id)) OR (association_id IS NULL AND public.is_super_admin()))',
      tbl||'_select_admin', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (true)',
      tbl||'_insert_authenticated', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
      tbl||'_service_all', tbl
    );
  END LOOP;
END $$;

-- ============================================================
-- Tables user_id-based : historique_connexion, utilisateurs_actions_log, permissions_audit
-- ============================================================
DO $$
DECLARE tbl text; r record;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['historique_connexion','utilisateurs_actions_log','permissions_audit']
  LOOP
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=tbl LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, tbl);
    END LOOP;
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (user_id = auth.uid() OR public.is_admin() OR public.is_super_admin())',
      tbl||'_select', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR INSERT TO authenticated WITH CHECK (true)',
      tbl||'_insert', tbl
    );
    EXECUTE format(
      'CREATE POLICY %I ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)',
      tbl||'_service_all', tbl
    );
  END LOOP;
END $$;

-- ============================================================
-- security_scans : super_admin uniquement
-- ============================================================
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='security_scans' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.security_scans', r.policyname);
  END LOOP;
END $$;

CREATE POLICY "security_scans_super_admin" ON public.security_scans
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

CREATE POLICY "security_scans_service_all" ON public.security_scans
  FOR ALL TO service_role USING (true) WITH CHECK (true);
