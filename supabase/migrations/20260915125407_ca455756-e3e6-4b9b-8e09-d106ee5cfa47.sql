-- Unicité des sanctions auto-générées (idempotence de la clôture)
CREATE UNIQUE INDEX IF NOT EXISTS reunions_sanctions_auto_unique
  ON public.reunions_sanctions (reunion_id, membre_id, type_sanction)
  WHERE type_sanction IN ('absence', 'huile_savon');

CREATE OR REPLACE FUNCTION public.cloturer_reunion(_reunion_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assoc uuid;
  v_statut text;
  v_montant_absence numeric;
  v_montant_hs numeric;
  v_nb_absences_creees int := 0;
  v_nb_sanctions_absence int := 0;
  v_nb_sanctions_hs int := 0;
  v_presents int := 0;
  v_total_membres int := 0;
  v_nb_cr int := 0;
  v_taux numeric := 0;
BEGIN
  SELECT association_id, statut INTO v_assoc, v_statut
  FROM public.reunions WHERE id = _reunion_id;

  IF v_assoc IS NULL THEN
    RAISE EXCEPTION 'Réunion introuvable' USING ERRCODE = 'P0002';
  END IF;

  IF NOT (public.is_admin_of(v_assoc, auth.uid())
          OR public.has_privileged_role_in(v_assoc, auth.uid())) THEN
    RAISE EXCEPTION 'Droits insuffisants pour clôturer cette réunion' USING ERRCODE = '42501';
  END IF;

  IF v_statut = 'terminee' THEN
    RETURN jsonb_build_object('deja_cloturee', true, 'reunion_id', _reunion_id);
  END IF;

  SELECT count(*) INTO v_nb_cr FROM public.rapports_seances WHERE reunion_id = _reunion_id;
  IF v_nb_cr = 0 THEN
    RAISE EXCEPTION 'Aucun point de compte rendu : clôture impossible' USING ERRCODE = 'P0001';
  END IF;

  SELECT count(*) INTO v_presents
  FROM public.reunions_presences
  WHERE reunion_id = _reunion_id AND statut_presence = 'present';
  IF v_presents = 0 THEN
    RAISE EXCEPTION 'Aucun présent enregistré : clôture impossible' USING ERRCODE = 'P0001';
  END IF;

  SELECT COALESCE((SELECT valeur::numeric FROM public.configurations WHERE cle = 'sanction_absence_montant'), 500)
    INTO v_montant_absence;
  SELECT COALESCE((SELECT valeur::numeric FROM public.configurations WHERE cle = 'sanction_huile_savon_montant'), 2000)
    INTO v_montant_hs;

  -- 1. Membres non pointés => absents non excusés
  WITH ins AS (
    INSERT INTO public.reunions_presences (reunion_id, membre_id, statut_presence, present, association_id)
    SELECT _reunion_id, m.id, 'absent_non_excuse', false, v_assoc
    FROM public.membres m
    WHERE m.association_id = v_assoc
      AND m.statut = 'actif'
      AND m.est_membre_e2d = true
      AND NOT EXISTS (
        SELECT 1 FROM public.reunions_presences rp
        WHERE rp.reunion_id = _reunion_id AND rp.membre_id = m.id
      )
    ON CONFLICT (reunion_id, membre_id) DO NOTHING
    RETURNING 1
  )
  SELECT count(*) INTO v_nb_absences_creees FROM ins;

  -- 2. Sanctions d'absence
  WITH ins AS (
    INSERT INTO public.reunions_sanctions
      (reunion_id, membre_id, type_sanction, montant_amende, motif, statut, association_id)
    SELECT _reunion_id, rp.membre_id, 'absence', v_montant_absence,
           'Absence non excusée à la réunion', 'impaye', v_assoc
    FROM public.reunions_presences rp
    WHERE rp.reunion_id = _reunion_id AND rp.statut_presence = 'absent_non_excuse'
    ON CONFLICT DO NOTHING
    RETURNING 1
  )
  SELECT count(*) INTO v_nb_sanctions_absence FROM ins;

  -- 3. Sanctions Huile & Savon
  WITH ins AS (
    INSERT INTO public.reunions_sanctions
      (reunion_id, membre_id, type_sanction, montant_amende, motif, statut, association_id)
    SELECT _reunion_id, m.id, 'huile_savon', v_montant_hs,
           'Huile & Savon non apporté', 'impaye', v_assoc
    FROM public.membres m
    WHERE m.association_id = v_assoc
      AND m.statut = 'actif'
      AND m.est_membre_e2d = true
      AND NOT EXISTS (
        SELECT 1 FROM public.reunions_huile_savon hs
        WHERE hs.reunion_id = _reunion_id AND hs.membre_id = m.id AND hs.valide = true
      )
    ON CONFLICT DO NOTHING
    RETURNING 1
  )
  SELECT count(*) INTO v_nb_sanctions_hs FROM ins;

  -- 4. Taux de présence
  SELECT count(*) INTO v_total_membres
  FROM public.membres
  WHERE association_id = v_assoc AND statut = 'actif' AND est_membre_e2d = true;

  SELECT count(*) INTO v_presents
  FROM public.reunions_presences
  WHERE reunion_id = _reunion_id AND statut_presence = 'present';

  IF v_total_membres > 0 THEN
    v_taux := round((v_presents::numeric / v_total_membres) * 100, 1);
  END IF;

  UPDATE public.reunions
  SET statut = 'terminee', taux_presence = v_taux
  WHERE id = _reunion_id;

  PERFORM public.log_audit(
    'REUNION_CLOTURE', 'reunions', _reunion_id,
    jsonb_build_object(
      'absences_creees', v_nb_absences_creees,
      'sanctions_absence', v_nb_sanctions_absence,
      'sanctions_huile_savon', v_nb_sanctions_hs,
      'taux_presence', v_taux
    )
  );

  RETURN jsonb_build_object(
    'deja_cloturee', false,
    'reunion_id', _reunion_id,
    'absences_creees', v_nb_absences_creees,
    'sanctions_absence', v_nb_sanctions_absence,
    'sanctions_huile_savon', v_nb_sanctions_hs,
    'presents', v_presents,
    'total_membres', v_total_membres,
    'taux_presence', v_taux
  );
END;
$$;

REVOKE ALL ON FUNCTION public.cloturer_reunion(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.cloturer_reunion(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.rouvrir_reunion(
  _reunion_id uuid,
  _supprimer_sanctions boolean DEFAULT false,
  _motif text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assoc uuid;
  v_statut text;
  v_op record;
  v_nb_ops int := 0;
  v_nb_sanctions int := 0;
  v_nb_cotisations int := 0;
BEGIN
  SELECT association_id, statut INTO v_assoc, v_statut
  FROM public.reunions WHERE id = _reunion_id;

  IF v_assoc IS NULL THEN
    RAISE EXCEPTION 'Réunion introuvable' USING ERRCODE = 'P0002';
  END IF;

  IF NOT public.is_admin_of(v_assoc, auth.uid()) THEN
    RAISE EXCEPTION 'Seul un administrateur de l''association peut rouvrir une réunion' USING ERRCODE = '42501';
  END IF;

  IF v_statut <> 'terminee' THEN
    RETURN jsonb_build_object('deja_ouverte', true, 'reunion_id', _reunion_id);
  END IF;

  UPDATE public.reunions
  SET statut = 'en_cours', taux_presence = NULL
  WHERE id = _reunion_id;

  UPDATE public.cotisations
  SET verrouille = false
  WHERE reunion_id = _reunion_id AND verrouille IS DISTINCT FROM false;
  GET DIAGNOSTICS v_nb_cotisations = ROW_COUNT;

  FOR v_op IN
    SELECT id FROM public.fond_caisse_operations
    WHERE reunion_id = _reunion_id
      AND COALESCE(statut, '') <> 'annulee'
  LOOP
    BEGIN
      PERFORM public.reverse_caisse_movement(
        v_op.id,
        COALESCE(_motif, 'Réouverture de la réunion')
      );
      v_nb_ops := v_nb_ops + 1;
    EXCEPTION WHEN OTHERS THEN
      NULL; -- opération déjà annulée ou non réversible : on continue
    END;
  END LOOP;

  IF _supprimer_sanctions THEN
    DELETE FROM public.reunions_sanctions
    WHERE reunion_id = _reunion_id
      AND type_sanction IN ('absence', 'huile_savon')
      AND statut = 'impaye';
    GET DIAGNOSTICS v_nb_sanctions = ROW_COUNT;
  END IF;

  PERFORM public.log_audit(
    'REUNION_REOUVERTURE', 'reunions', _reunion_id,
    jsonb_build_object(
      'motif', _motif,
      'sanctions_supprimees', v_nb_sanctions,
      'operations_caisse_annulees', v_nb_ops,
      'cotisations_deverrouillees', v_nb_cotisations
    )
  );

  RETURN jsonb_build_object(
    'deja_ouverte', false,
    'reunion_id', _reunion_id,
    'sanctions_supprimees', v_nb_sanctions,
    'operations_caisse_annulees', v_nb_ops,
    'cotisations_deverrouillees', v_nb_cotisations
  );
END;
$$;

REVOKE ALL ON FUNCTION public.rouvrir_reunion(uuid, boolean, text) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.rouvrir_reunion(uuid, boolean, text) TO authenticated, service_role;