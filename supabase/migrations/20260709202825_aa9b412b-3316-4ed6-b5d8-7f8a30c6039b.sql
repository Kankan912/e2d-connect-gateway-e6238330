
-- Phase 4.2 — FinancialEngine (SQL)
-- Deux RPC : record_caisse_movement (écriture unifiée, idempotente, tenant-aware)
-- et get_solde_empruntable (règle 80% portée côté serveur).

CREATE OR REPLACE FUNCTION public.record_caisse_movement(
  p_type        text,
  p_montant     numeric,
  p_categorie   text,
  p_libelle     text,
  p_source_table text DEFAULT NULL,
  p_source_id    uuid DEFAULT NULL,
  p_beneficiaire_id uuid DEFAULT NULL,
  p_reunion_id   uuid DEFAULT NULL,
  p_exercice_id  uuid DEFAULT NULL,
  p_date_operation date DEFAULT NULL,
  p_notes        text DEFAULT NULL,
  p_justificatif_url text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id            uuid;
  v_association   uuid;
  v_operateur     uuid;
  v_categorie     text;
BEGIN
  IF p_type NOT IN ('entree', 'sortie') THEN
    RAISE EXCEPTION 'type_operation invalide: %', p_type USING ERRCODE = '22023';
  END IF;

  IF p_montant IS NULL OR p_montant <= 0 THEN
    RAISE EXCEPTION 'montant doit être strictement positif (reçu: %)', p_montant USING ERRCODE = '22023';
  END IF;

  v_operateur := auth.uid();
  IF v_operateur IS NULL THEN
    RAISE EXCEPTION 'record_caisse_movement requiert un utilisateur authentifié' USING ERRCODE = '42501';
  END IF;

  -- Tenant courant (Phase 3) avec fallback association par défaut.
  BEGIN
    v_association := public.current_tenant_id();
  EXCEPTION WHEN OTHERS THEN
    v_association := public.default_association_id();
  END;

  IF v_association IS NULL THEN
    v_association := public.default_association_id();
  END IF;

  v_categorie := COALESCE(NULLIF(trim(p_categorie), ''), 'autre');

  -- Idempotence : même source déjà écrite → renvoyer l'existant.
  IF p_source_table IS NOT NULL AND p_source_id IS NOT NULL THEN
    SELECT id INTO v_id
    FROM public.fond_caisse_operations
    WHERE source_table = p_source_table
      AND source_id    = p_source_id
      AND type_operation = p_type
      AND categorie      = v_categorie
      AND association_id = v_association
    LIMIT 1;

    IF v_id IS NOT NULL THEN
      RETURN v_id;
    END IF;
  END IF;

  INSERT INTO public.fond_caisse_operations (
    type_operation, montant, libelle, categorie,
    source_table, source_id,
    operateur_id, beneficiaire_id,
    reunion_id, exercice_id,
    date_operation, notes, justificatif_url,
    association_id, created_by
  ) VALUES (
    p_type, p_montant, COALESCE(p_libelle, v_categorie), v_categorie,
    p_source_table, p_source_id,
    v_operateur, p_beneficiaire_id,
    p_reunion_id, p_exercice_id,
    COALESCE(p_date_operation, CURRENT_DATE), p_notes, p_justificatif_url,
    v_association, v_operateur
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

COMMENT ON FUNCTION public.record_caisse_movement(text, numeric, text, text, text, uuid, uuid, uuid, uuid, date, text, text)
IS 'FinancialEngine — écriture unifiée dans fond_caisse_operations. Idempotent par (source_table, source_id, type, categorie, association).';

GRANT EXECUTE ON FUNCTION public.record_caisse_movement(text, numeric, text, text, text, uuid, uuid, uuid, uuid, date, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_caisse_movement(text, numeric, text, text, text, uuid, uuid, uuid, uuid, date, text, text) TO service_role;

-- ---------------------------------------------------------------------------
-- get_solde_empruntable : règle 80% (fond total × 0.8) − prêts en cours,
-- portée côté serveur pour être consommée par tous les canaux (workflow prêts,
-- dashboard, edge functions) sans divergence avec le client.
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.get_solde_empruntable(
  p_association_id uuid DEFAULT NULL,
  p_pourcentage    integer DEFAULT 80
)
RETURNS numeric
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_association  uuid;
  v_fond_total   numeric;
  v_prets_en_cours numeric;
  v_seuil        numeric;
BEGIN
  IF p_pourcentage IS NULL OR p_pourcentage <= 0 OR p_pourcentage > 100 THEN
    RAISE EXCEPTION 'pourcentage invalide (attendu 1-100): %', p_pourcentage USING ERRCODE = '22023';
  END IF;

  v_association := COALESCE(
    p_association_id,
    (SELECT public.current_tenant_id()),
    public.default_association_id()
  );

  SELECT COALESCE(SUM(
    CASE WHEN type_operation = 'entree' THEN montant
         WHEN type_operation = 'sortie' THEN -montant
         ELSE 0 END
  ), 0)
  INTO v_fond_total
  FROM public.fond_caisse_operations
  WHERE association_id = v_association;

  SELECT COALESCE(SUM(GREATEST(0, montant - COALESCE(montant_paye, 0))), 0)
  INTO v_prets_en_cours
  FROM public.prets
  WHERE association_id = v_association
    AND statut NOT IN ('rembourse', 'annule');

  v_seuil := floor(GREATEST(0, v_fond_total) * p_pourcentage / 100.0);
  RETURN GREATEST(0, v_seuil - v_prets_en_cours);
END;
$$;

COMMENT ON FUNCTION public.get_solde_empruntable(uuid, integer)
IS 'FinancialEngine — solde empruntable serveur : max(0, floor(fond×%/100) − prêts_en_cours).';

GRANT EXECUTE ON FUNCTION public.get_solde_empruntable(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_solde_empruntable(uuid, integer) TO service_role;
