
DO $$
DECLARE
  v_e2d uuid;
  t text;
  tenant_tables text[] := ARRAY[
    'adhesions','aides','aides_types','aides_validation_history',
    'beneficiaires_paiements_audit','calendrier_beneficiaires','cotisations',
    'cotisations_mensuelles_exercice','demandes_adhesion','donations','epargnes',
    'exercices','fond_caisse_operations','loan_requests','match_statistics',
    'membres','notifications','prets','prets_paiements','prets_reconductions',
    'profiles','reunion_beneficiaires','reunions','reunions_presences',
    'reunions_sanctions','sanctions'
  ];
BEGIN
  SELECT id INTO v_e2d FROM public.associations WHERE slug='e2d';
  IF v_e2d IS NULL THEN RAISE EXCEPTION 'E2D association introuvable'; END IF;

  FOREACH t IN ARRAY tenant_tables LOOP
    EXECUTE format('UPDATE public.%I SET association_id=$1 WHERE association_id IS NULL', t) USING v_e2d;
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN association_id SET NOT NULL', t);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(association_id)', t||'_association_id_idx', t);
  END LOOP;
END $$;
