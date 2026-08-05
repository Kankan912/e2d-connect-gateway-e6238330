CREATE OR REPLACE FUNCTION public.get_membre_situation(p_membre_id uuid, p_exercice_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
    SELECT id, nom, prenom, email, telephone, statut, fonction
    FROM public.membres WHERE id = p_membre_id
  ) m;

  SELECT COALESCE(jsonb_agg(to_jsonb(c) ORDER BY c.date_paiement DESC NULLS LAST), '[]'::jsonb)
    INTO v_cotisations
  FROM (
    SELECT c.id, c.exercice_id, c.montant, c.statut, c.date_paiement,
           t.nom AS type_nom
    FROM public.cotisations c
    LEFT JOIN public.cotisations_types t ON t.id = c.type_cotisation_id
    WHERE c.membre_id = p_membre_id
      AND (p_exercice_id IS NULL OR c.exercice_id = p_exercice_id)
  ) c;

  SELECT COALESCE(jsonb_agg(to_jsonb(p) ORDER BY p.date_pret DESC NULLS LAST), '[]'::jsonb)
    INTO v_prets
  FROM (
    SELECT id, montant, taux_interet, date_pret, echeance AS date_echeance,
           statut, montant_paye, montant_total_du, exercice_id
    FROM public.prets
    WHERE membre_id = p_membre_id
      AND (p_exercice_id IS NULL OR exercice_id = p_exercice_id)
  ) p;

  SELECT COALESCE(jsonb_agg(to_jsonb(a) ORDER BY a.date_allocation DESC NULLS LAST), '[]'::jsonb)
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

  SELECT COALESCE(jsonb_agg(to_jsonb(e) ORDER BY e.date_operation DESC NULLS LAST), '[]'::jsonb)
    INTO v_epargnes
  FROM (
    SELECT id, montant, date_depot AS date_operation, statut, exercice_id
    FROM public.epargnes
    WHERE membre_id = p_membre_id
      AND (p_exercice_id IS NULL OR exercice_id = p_exercice_id)
  ) e;

  SELECT COALESCE(jsonb_agg(to_jsonb(s) ORDER BY s.date_sanction DESC NULLS LAST), '[]'::jsonb)
    INTO v_sanctions
  FROM (
    SELECT s.id, s.montant, s.montant_paye, s.date_sanction, s.statut, s.motif
    FROM public.sanctions s
    WHERE s.membre_id = p_membre_id
  ) s;

  SELECT COALESCE(jsonb_agg(to_jsonb(b) ORDER BY b.created_at DESC NULLS LAST), '[]'::jsonb)
    INTO v_beneficiaires
  FROM (
    SELECT rb.id, rb.reunion_id,
           COALESCE(rb.montant_brut, rb.montant_benefice) AS montant_prevu,
           rb.montant_final AS montant_paye,
           rb.statut, rb.date_paiement,
           NULLIF(TRIM((regexp_match(COALESCE(rb.notes_paiement, ''), 'Mode\s*:\s*([^\n\r]+)'))[1]), '') AS mode_paiement,
           NULLIF(TRIM((regexp_match(COALESCE(rb.notes_paiement, ''), 'R[ée]f[ée]rence\s*:\s*([^\n\r]+)'))[1]), '') AS reference_paiement,
           rb.notes_paiement,
           rb.created_at
    FROM public.reunion_beneficiaires rb
    WHERE rb.membre_id = p_membre_id
  ) b;

  v_totaux := jsonb_build_object(
    'cotisations_payees', COALESCE((
      SELECT SUM(montant) FROM public.cotisations
      WHERE membre_id = p_membre_id AND statut = 'paye'
        AND (p_exercice_id IS NULL OR exercice_id = p_exercice_id)
    ), 0),
    'prets_en_cours', COALESCE((
      SELECT SUM(GREATEST(COALESCE(montant_total_du, montant) - COALESCE(montant_paye, 0), 0)) FROM public.prets
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
      SELECT SUM(GREATEST(montant - COALESCE(montant_paye, 0), 0)) FROM public.sanctions
      WHERE membre_id = p_membre_id AND statut IN ('impayee', 'impaye', 'partiel')
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
$function$;