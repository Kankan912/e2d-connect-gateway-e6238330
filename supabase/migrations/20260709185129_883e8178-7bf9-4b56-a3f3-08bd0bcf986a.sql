
-- Fonction qui retourne l'association par défaut de l'utilisateur courant
CREATE OR REPLACE FUNCTION public.default_association_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    -- Priorité 1 : association du membre lié à l'utilisateur connecté
    (SELECT association_id FROM public.membres
      WHERE user_id = auth.uid()
        AND association_id IS NOT NULL
      LIMIT 1),
    -- Priorité 2 : première association via user_roles
    (SELECT association_id FROM public.user_roles
      WHERE user_id = auth.uid()
        AND association_id IS NOT NULL
      LIMIT 1),
    -- Fallback : E2D (période de transition)
    (SELECT id FROM public.associations WHERE slug = 'e2d')
  );
$$;

-- Application du DEFAULT sur les tables tenant NOT NULL
DO $$
DECLARE
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
  FOREACH t IN ARRAY tenant_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ALTER COLUMN association_id SET DEFAULT public.default_association_id()', t);
  END LOOP;
END $$;
