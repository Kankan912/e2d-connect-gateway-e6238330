
-- Lot 2.4.2 — Finance & caisse

-- Tables avec association_id : patron admin_write
SELECT public._apply_tenant_rls(t) FROM unnest(ARRAY[
  'aides','aides_types','aides_validation_history','calendrier_beneficiaires',
  'cotisations','cotisations_mensuelles_exercice','cotisations_types',
  'donations','epargnes','fond_caisse_clotures','fond_caisse_operations',
  'loan_requests','prets','prets_paiements','prets_reconductions',
  'recurring_donations','reunion_beneficiaires'
]::text[]) AS t;

-- Enfants sans association_id : lecture auth, écriture admin
DO $$
DECLARE tbl text; r record;
BEGIN
  FOREACH tbl IN ARRAY ARRAY[
    'cotisations_membres','cotisations_mensuelles_audit','cotisations_minimales',
    'tontine_attributions','beneficiaires_paiements_audit'
  ]
  LOOP
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=tbl LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, tbl);
    END LOOP;
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)', tbl||'_select_auth', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.is_admin() OR public.is_super_admin()) WITH CHECK (public.is_admin() OR public.is_super_admin())', tbl||'_write_admin', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)', tbl||'_service_all', tbl);
  END LOOP;
END $$;
