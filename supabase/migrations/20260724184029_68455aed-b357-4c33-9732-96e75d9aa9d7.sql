
-- =============================================
-- Lot C — get_membre_situation + justificatif obligatoire
-- =============================================

CREATE OR REPLACE FUNCTION public.get_membre_situation(
  p_membre_id uuid,
  p_exercice_id uuid DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_membre jsonb;
  v_cotisations jsonb;
  v_prets jsonb;
  v_aides jsonb;
  v_epargnes jsonb;
  v_sanctions jsonb;
  v_beneficiaires jsonb;
  v_totaux jsonb;
BEGIN
  -- Sécurité : accessible au membre lui-même ou à un admin
  IF NOT (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.membres m
      WHERE m.id = p_membre_id AND m.user_id = auth.uid()
    )
  ) THEN
    RAISE EXCEPTION 'Accès refusé à la situation de ce membre';
  END IF;

  SELECT to_jsonb(m) INTO v_membre
  FROM (
    SELECT id, nom, prenom, email, telephone, statut, matricule
    FROM public.membres WHERE id = p_membre_id
  ) m;

  SELECT COALESCE(jsonb_agg(row_to_json(c) ORDER BY (c->>'annee') DESC, (c->>'mois') DESC), '[]'::jsonb)
    INTO v_cotisations
  FROM (
    SELECT cme.id, cme.exercice_id, cme.annee, cme.mois, cme.montant, cme.statut, cme.date_paiement
    FROM public.cotisations_mensuelles_exercice cme
    WHERE cme.membre_id = p_membre_id
      AND (p_exercice_id IS NULL OR cme.exercice_id = p_exercice_id)
  ) c;

  SELECT COALESCE(jsonb_agg(row_to_json(p) ORDER BY (p->>'date_pret') DESC), '[]'::jsonb)
    INTO v_prets
  FROM (
    SELECT id, montant, taux_interet, date_pret, date_echeance, statut, montant_paye, exercice_id
    FROM public.prets
    WHERE membre_id = p_membre_id
      AND (p_exercice_id IS NULL OR exercice_id = p_exercice_id)
  ) p;

  SELECT COALESCE(jsonb_agg(row_to_json(a) ORDER BY (a->>'date_allocation') DESC), '[]'::jsonb)
    INTO v_aides
  FROM (
    SELECT a.id, a.montant, a.date_allocation, a.statut, a.contexte_aide,
           a.justificatif_url, a.exercice_id,
           t.nom AS type_nom
    FROM public.aides a
    LEFT JOIN public.aides_types t ON t.id = a.type_aide_id
    WHERE a.beneficiaire_id = p_membre_id
      AND (p_exercice_id IS NULL OR a.exercice_id = p_exercice_id)
  ) a;

  SELECT COALESCE(jsonb_agg(row_to_json(e) ORDER BY (e->>'date_operation') DESC), '[]'::jsonb)
    INTO v_epargnes
  FROM (
    SELECT id, montant, date_operation, statut, exercice_id
    FROM public.epargnes
    WHERE membre_id = p_membre_id
      AND (p_exercice_id IS NULL OR exercice_id = p_exercice_id)
  ) e;

  SELECT COALESCE(jsonb_agg(row_to_json(s) ORDER BY (s->>'date_sanction') DESC), '[]'::jsonb)
    INTO v_sanctions
  FROM (
    SELECT s.id, s.montant, s.date_sanction, s.statut, s.motif, s.exercice_id
    FROM public.sanctions s
    WHERE s.membre_id = p_membre_id
      AND (p_exercice_id IS NULL OR s.exercice_id = p_exercice_id)
  ) s;

  SELECT COALESCE(jsonb_agg(row_to_json(b) ORDER BY (b->>'created_at') DESC), '[]'::jsonb)
    INTO v_beneficiaires
  FROM (
    SELECT rb.id, rb.reunion_id, rb.montant_prevu, rb.montant_paye, rb.statut,
           rb.date_paiement, rb.mode_paiement, rb.created_at
    FROM public.reunion_beneficiaires rb
    WHERE rb.beneficiaire_id = p_membre_id
  ) b;

  v_totaux := jsonb_build_object(
    'cotisations_payees', COALESCE((
      SELECT SUM(montant) FROM public.cotisations_mensuelles_exercice
      WHERE membre_id = p_membre_id AND statut = 'paye'
        AND (p_exercice_id IS NULL OR exercice_id = p_exercice_id)
    ), 0),
    'prets_en_cours', COALESCE((
      SELECT SUM(montant - COALESCE(montant_paye, 0)) FROM public.prets
      WHERE membre_id = p_membre_id AND statut IN ('en_cours', 'partiel', 'en_retard', 'reconduit')
        AND (p_exercice_id IS NULL OR exercice_id = p_exercice_id)
    ), 0),
    'aides_recues', COALESCE((
      SELECT SUM(montant) FROM public.aides
      WHERE beneficiaire_id = p_membre_id AND statut IN ('allouee', 'alloue', 'payee')
        AND (p_exercice_id IS NULL OR exercice_id = p_exercice_id)
    ), 0),
    'epargnes_totales', COALESCE((
      SELECT SUM(montant) FROM public.epargnes
      WHERE membre_id = p_membre_id
        AND (p_exercice_id IS NULL OR exercice_id = p_exercice_id)
    ), 0),
    'sanctions_dues', COALESCE((
      SELECT SUM(montant) FROM public.sanctions
      WHERE membre_id = p_membre_id AND statut IN ('impayee', 'partiel')
        AND (p_exercice_id IS NULL OR exercice_id = p_exercice_id)
    ), 0)
  );

  RETURN jsonb_build_object(
    'membre', v_membre,
    'exercice_id', p_exercice_id,
    'cotisations', v_cotisations,
    'prets', v_prets,
    'aides', v_aides,
    'epargnes', v_epargnes,
    'sanctions', v_sanctions,
    'beneficiaires_paiements', v_beneficiaires,
    'totaux', v_totaux
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_membre_situation(uuid, uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.get_membre_situation(uuid, uuid) TO authenticated;

-- =============================================
-- Trigger : justificatif obligatoire pour valider une aide
-- =============================================
CREATE OR REPLACE FUNCTION public.enforce_aide_justificatif()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.statut IN ('allouee', 'alloue', 'payee')
     AND (OLD.statut IS DISTINCT FROM NEW.statut)
     AND (NEW.justificatif_url IS NULL OR btrim(NEW.justificatif_url) = '') THEN
    RAISE EXCEPTION 'Un justificatif est requis pour valider une aide (statut = %)', NEW.statut
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_aide_justificatif ON public.aides;
CREATE TRIGGER trg_enforce_aide_justificatif
  BEFORE UPDATE ON public.aides
  FOR EACH ROW EXECUTE FUNCTION public.enforce_aide_justificatif();
