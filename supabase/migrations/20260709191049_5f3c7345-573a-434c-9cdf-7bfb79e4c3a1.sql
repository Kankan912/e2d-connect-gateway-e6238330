
-- Lot 2.4.4 — Sport E2D & Phoenix

-- Tables publiques (SELECT public + write admin)
SELECT public._apply_tenant_rls(t, true, true, 'true') FROM unnest(ARRAY[
  'sport_e2d_matchs','sport_phoenix_matchs',
  'match_compte_rendus','match_medias','match_statistics',
  'phoenix_compositions','phoenix_entrainements','phoenix_entrainements_internes',
  'phoenix_equipes','phoenix_evenements_match',
  'phoenix_statistiques_annuelles','phoenix_statistiques_joueur','phoenix_stats_jaune_rouge'
]::text[]) AS t;

-- Tables internes (SELECT auth + write admin)
SELECT public._apply_tenant_rls(t) FROM unnest(ARRAY[
  'sport_e2d_activites','sport_e2d_depenses','sport_e2d_recettes',
  'sport_phoenix_depenses','sport_phoenix_recettes',
  'phoenix_adherents','phoenix_cotisations_annuelles','phoenix_presences'
]::text[]) AS t;

-- Enfants sans association_id
DO $$
DECLARE tbl text; r record;
BEGIN
  FOREACH tbl IN ARRAY ARRAY['match_joueurs','match_presences','sport_e2d_presences','phoenix_presences_entrainement']
  LOOP
    FOR r IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename=tbl LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', r.policyname, tbl);
    END LOOP;
    EXECUTE format('CREATE POLICY %I ON public.%I FOR SELECT TO authenticated USING (true)', tbl||'_select_auth', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO authenticated USING (public.is_admin() OR public.is_super_admin()) WITH CHECK (public.is_admin() OR public.is_super_admin())', tbl||'_write_admin', tbl);
    EXECUTE format('CREATE POLICY %I ON public.%I FOR ALL TO service_role USING (true) WITH CHECK (true)', tbl||'_service_all', tbl);
  END LOOP;
END $$;
