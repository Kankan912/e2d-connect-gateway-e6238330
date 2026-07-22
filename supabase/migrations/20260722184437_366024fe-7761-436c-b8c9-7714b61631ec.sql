
-- Lot B — Bénéficiaires 1↔N + auto-remplissage réunion

-- RPC: auto-remplit reunion_beneficiaires à partir du calendrier du mois
CREATE OR REPLACE FUNCTION public.auto_fill_reunion_beneficiaires(p_reunion_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_reunion_date date;
  v_reunion_mois int;
  v_exercice_id uuid;
  v_inserted int := 0;
  v_row record;
  v_calc jsonb;
BEGIN
  SELECT date_reunion::date INTO v_reunion_date FROM reunions WHERE id = p_reunion_id;
  IF v_reunion_date IS NULL THEN
    RETURN 0;
  END IF;
  v_reunion_mois := EXTRACT(MONTH FROM v_reunion_date)::int;

  -- Exercice correspondant
  SELECT id INTO v_exercice_id FROM exercices
   WHERE date_debut <= v_reunion_date AND date_fin >= v_reunion_date
   ORDER BY (statut = 'actif') DESC
   LIMIT 1;
  IF v_exercice_id IS NULL THEN
    RETURN 0;
  END IF;

  FOR v_row IN
    SELECT cb.id AS calendrier_id, cb.membre_id, cb.montant_total, cb.montant_mensuel
      FROM calendrier_beneficiaires cb
     WHERE cb.exercice_id = v_exercice_id
       AND cb.mois_benefice = v_reunion_mois
       AND NOT EXISTS (
         SELECT 1 FROM reunion_beneficiaires rb
          WHERE rb.reunion_id = p_reunion_id AND rb.membre_id = cb.membre_id
       )
     ORDER BY cb.rang
  LOOP
    v_calc := public.calculer_montant_beneficiaire(v_row.membre_id, v_exercice_id);
    INSERT INTO reunion_beneficiaires (
      reunion_id, membre_id, calendrier_id,
      montant_benefice, montant_brut, deductions, montant_final,
      statut, date_benefice_prevue
    ) VALUES (
      p_reunion_id, v_row.membre_id, v_row.calendrier_id,
      COALESCE((v_calc->>'montant_net')::numeric, v_row.montant_total),
      COALESCE((v_calc->>'montant_brut')::numeric, v_row.montant_total),
      jsonb_build_object('sanctions_impayees', COALESCE((v_calc->>'sanctions_impayees')::numeric, 0)),
      COALESCE((v_calc->>'montant_net')::numeric, v_row.montant_total),
      'prevu', v_reunion_date
    );
    v_inserted := v_inserted + 1;
  END LOOP;

  RETURN v_inserted;
END;
$$;

REVOKE ALL ON FUNCTION public.auto_fill_reunion_beneficiaires(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.auto_fill_reunion_beneficiaires(uuid) TO authenticated, service_role;

-- Trigger : auto-fill à la création de la réunion
CREATE OR REPLACE FUNCTION public.trg_reunion_auto_fill_beneficiaires()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  PERFORM public.auto_fill_reunion_beneficiaires(NEW.id);
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS reunion_auto_fill_beneficiaires ON public.reunions;
CREATE TRIGGER reunion_auto_fill_beneficiaires
AFTER INSERT ON public.reunions
FOR EACH ROW EXECUTE FUNCTION public.trg_reunion_auto_fill_beneficiaires();

-- RPC : valider paiement bénéficiaire (montant réel, mode, référence)
CREATE OR REPLACE FUNCTION public.valider_paiement_beneficiaire(
  p_id uuid,
  p_montant numeric,
  p_date_paiement timestamptz DEFAULT now(),
  p_mode text DEFAULT NULL,
  p_reference text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_notes text;
BEGIN
  IF p_montant IS NULL OR p_montant <= 0 THEN
    RAISE EXCEPTION 'Montant invalide';
  END IF;

  v_notes := COALESCE(p_notes, '');
  IF p_mode IS NOT NULL THEN v_notes := v_notes || E'\nMode: ' || p_mode; END IF;
  IF p_reference IS NOT NULL THEN v_notes := v_notes || E'\nRéférence: ' || p_reference; END IF;

  UPDATE reunion_beneficiaires
     SET statut = 'paye',
         montant_final = p_montant,
         montant_benefice = p_montant,
         date_paiement = p_date_paiement,
         paye_par = v_uid,
         notes_paiement = NULLIF(trim(v_notes), ''),
         updated_at = now()
   WHERE id = p_id;

  -- La sortie caisse est enregistrée par le trigger sync_reunion_beneficiaire_to_caisse
  RETURN p_id;
END;
$$;

REVOKE ALL ON FUNCTION public.valider_paiement_beneficiaire(uuid, numeric, timestamptz, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.valider_paiement_beneficiaire(uuid, numeric, timestamptz, text, text, text) TO authenticated, service_role;
