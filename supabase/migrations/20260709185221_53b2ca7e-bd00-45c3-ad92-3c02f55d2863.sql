
DO $$
DECLARE
  v_e2d uuid; v_phoenix uuid; t text;
  e2d_tables text[] := ARRAY[
    'alertes_budgetaires','beneficiaires_config','caisse_config',
    'cms_events','cms_gallery','cms_hero_slides','cms_pages','cms_partners',
    'cms_sections','cms_settings','cotisations_types',
    'exercices_cotisations_types','exports_programmes','fichiers_joint',
    'fond_caisse_clotures','match_compte_rendus','match_gala_config',
    'match_medias','messages_contact','payment_configs',
    'pret_reconduction_validation_config','prets_config','rapports_seances',
    'recurring_donations','sanctions_tarifs','sanctions_types','session_config',
    'site_about','site_activities','site_config','site_events',
    'site_events_carousel_config','site_gallery','site_gallery_albums',
    'site_hero','site_hero_images','site_partners','smtp_config',
    'sport_e2d_activites','sport_e2d_config','sport_e2d_depenses',
    'sport_e2d_matchs','sport_e2d_recettes','tontine_configurations','types_sanctions'
  ];
  phoenix_tables text[] := ARRAY[
    'phoenix_adherents','phoenix_compositions','phoenix_cotisations_annuelles',
    'phoenix_entrainements','phoenix_entrainements_internes','phoenix_equipes',
    'phoenix_evenements_match','phoenix_presences','phoenix_presences_entrainement',
    'phoenix_statistiques_annuelles','phoenix_statistiques_joueur','phoenix_stats_jaune_rouge',
    'sport_phoenix_config','sport_phoenix_depenses','sport_phoenix_matchs','sport_phoenix_recettes'
  ];
BEGIN
  SELECT id INTO v_e2d     FROM public.associations WHERE slug='e2d';
  SELECT id INTO v_phoenix FROM public.associations WHERE slug='phoenix';
  IF v_e2d IS NULL OR v_phoenix IS NULL THEN RAISE EXCEPTION 'Associations E2D ou Phoenix introuvables'; END IF;

  FOREACH t IN ARRAY e2d_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS association_id uuid REFERENCES public.associations(id)', t);
    EXECUTE format('UPDATE public.%I SET association_id=%L WHERE association_id IS NULL', t, v_e2d);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN association_id SET NOT NULL', t);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN association_id SET DEFAULT public.default_association_id()', t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(association_id)', t||'_association_id_idx', t);
  END LOOP;

  FOREACH t IN ARRAY phoenix_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS association_id uuid REFERENCES public.associations(id)', t);
    EXECUTE format('UPDATE public.%I SET association_id=%L WHERE association_id IS NULL', t, v_phoenix);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN association_id SET NOT NULL', t);
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN association_id SET DEFAULT %L::uuid', t, v_phoenix);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(association_id)', t||'_association_id_idx', t);
  END LOOP;
END $$;
