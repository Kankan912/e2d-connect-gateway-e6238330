
-- =============================================================================
-- Phase 4.4 — FinancialEngine : les triggers délèguent à record_caisse_movement
-- =============================================================================

-- 1) Étendre record_caisse_movement :
--    - nouveau paramètre p_operateur_id (opérateur explicite, prioritaire sur auth.uid())
--    - auth.uid() devient optionnel (les triggers SECURITY DEFINER n'ont pas de session)
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
  p_justificatif_url text DEFAULT NULL,
  p_operateur_id uuid DEFAULT NULL
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

  -- Opérateur : explicite > auth.uid() > premier membre disponible (fallback historique)
  v_operateur := COALESCE(p_operateur_id, auth.uid());
  IF v_operateur IS NULL THEN
    SELECT id INTO v_operateur FROM public.membres ORDER BY created_at NULLS LAST LIMIT 1;
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
    v_association, COALESCE(auth.uid(), v_operateur)
  )
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

COMMENT ON FUNCTION public.record_caisse_movement(text, numeric, text, text, text, uuid, uuid, uuid, uuid, date, text, text, uuid)
IS 'FinancialEngine (Phase 4.4) — écriture unifiée. Idempotent par (source_table, source_id, type, categorie, association). Utilisable par triggers (operateur explicite).';

GRANT EXECUTE ON FUNCTION public.record_caisse_movement(text, numeric, text, text, text, uuid, uuid, uuid, uuid, date, text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_caisse_movement(text, numeric, text, text, text, uuid, uuid, uuid, uuid, date, text, text, uuid) TO service_role;

-- =============================================================================
-- 2) create_caisse_operation_from_source : délègue à record_caisse_movement
-- =============================================================================
CREATE OR REPLACE FUNCTION public.create_caisse_operation_from_source()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_operateur_id uuid;
  v_libelle text;
  v_type_operation text;
  v_categorie text;
  v_montant numeric;
  v_date_operation date;
  v_reunion_id uuid;
  v_exercice_id uuid;
BEGIN
  -- Nettoyage sur DELETE
  IF TG_OP = 'DELETE' THEN
    DELETE FROM fond_caisse_operations
    WHERE source_table = TG_TABLE_NAME AND source_id = OLD.id;
    RETURN OLD;
  END IF;

  -- Nettoyage sur UPDATE lorsqu'un statut sort de l'état déclencheur
  IF TG_OP = 'UPDATE' THEN
    IF TG_TABLE_NAME = 'aides' AND OLD.statut = 'alloue' AND NEW.statut <> 'alloue' THEN
      DELETE FROM fond_caisse_operations WHERE source_table = 'aides' AND source_id = NEW.id;
      RETURN NEW;
    END IF;
    IF TG_TABLE_NAME = 'cotisations' AND OLD.statut = 'paye' AND NEW.statut <> 'paye' THEN
      DELETE FROM fond_caisse_operations WHERE source_table = 'cotisations' AND source_id = NEW.id;
      RETURN NEW;
    END IF;
    IF TG_TABLE_NAME = 'reunions_sanctions' AND OLD.statut = 'paye' AND NEW.statut <> 'paye' THEN
      DELETE FROM fond_caisse_operations WHERE source_table = 'reunions_sanctions' AND source_id = NEW.id;
      RETURN NEW;
    END IF;
  END IF;

  v_date_operation := CURRENT_DATE;
  v_reunion_id := NULL;
  v_exercice_id := NULL;

  IF TG_TABLE_NAME = 'epargnes' THEN
    v_type_operation := 'entree';
    v_categorie := 'epargne';
    v_montant := NEW.montant;
    v_date_operation := COALESCE(NEW.date_depot, CURRENT_DATE);
    v_reunion_id := NEW.reunion_id;
    v_exercice_id := NEW.exercice_id;
    SELECT CONCAT('Épargne - ', m.prenom, ' ', m.nom) INTO v_libelle
    FROM membres m WHERE m.id = NEW.membre_id;
    v_operateur_id := NEW.membre_id;

  ELSIF TG_TABLE_NAME = 'cotisations' THEN
    IF NEW.statut = 'paye' THEN
      v_type_operation := 'entree';
      v_categorie := 'cotisation';
      v_montant := NEW.montant;
      v_date_operation := COALESCE(NEW.date_paiement, CURRENT_DATE);
      v_reunion_id := NEW.reunion_id;
      v_exercice_id := NEW.exercice_id;
      SELECT CONCAT('Cotisation - ', m.prenom, ' ', m.nom, ' - ', COALESCE(ct.nom, 'Type inconnu')) INTO v_libelle
      FROM membres m
      LEFT JOIN cotisations_types ct ON ct.id = NEW.type_cotisation_id
      WHERE m.id = NEW.membre_id;
      v_operateur_id := NEW.membre_id;
    ELSE
      RETURN NEW;
    END IF;

  ELSIF TG_TABLE_NAME = 'reunions_sanctions' THEN
    IF NEW.statut = 'paye' THEN
      v_type_operation := 'entree';
      v_categorie := 'sanction';
      v_montant := NEW.montant;
      v_reunion_id := NEW.reunion_id;
      SELECT CONCAT('Sanction - ', m.prenom, ' ', m.nom, ' - ', NEW.motif) INTO v_libelle
      FROM membres m WHERE m.id = NEW.membre_id;
      v_operateur_id := NEW.membre_id;
    ELSE
      RETURN NEW;
    END IF;

  ELSIF TG_TABLE_NAME = 'prets' THEN
    IF TG_OP = 'INSERT' THEN
      v_type_operation := 'sortie';
      v_categorie := 'pret_decaissement';
      v_montant := NEW.montant;
      SELECT CONCAT('Prêt accordé - ', m.prenom, ' ', m.nom) INTO v_libelle
      FROM membres m WHERE m.id = NEW.membre_id;
      v_operateur_id := NEW.membre_id;
    ELSE
      RETURN NEW;
    END IF;

  ELSIF TG_TABLE_NAME = 'prets_paiements' THEN
    v_type_operation := 'entree';
    v_categorie := 'pret_remboursement';
    v_montant := NEW.montant_paye;
    SELECT CONCAT('Remboursement prêt - ', m.prenom, ' ', m.nom) INTO v_libelle
    FROM prets p JOIN membres m ON m.id = p.membre_id WHERE p.id = NEW.pret_id;
    SELECT p.membre_id INTO v_operateur_id FROM prets p WHERE p.id = NEW.pret_id;

  ELSIF TG_TABLE_NAME = 'aides' THEN
    IF NEW.statut = 'alloue' THEN
      v_type_operation := 'sortie';
      v_categorie := 'aide';
      v_montant := NEW.montant;
      v_exercice_id := NEW.exercice_id;
      v_reunion_id := NEW.reunion_id;
      SELECT CONCAT('Aide - ', m.prenom, ' ', m.nom, ' - ', at.nom) INTO v_libelle
      FROM membres m
      JOIN aides_types at ON at.id = NEW.type_aide_id
      WHERE m.id = NEW.beneficiaire_id;
      v_operateur_id := NEW.beneficiaire_id;
    ELSE
      RETURN NEW;
    END IF;

  ELSE
    RETURN NEW;
  END IF;

  -- Nettoyage de toute opération précédente pour cette source (permet la ré-écriture après changement de montant)
  DELETE FROM fond_caisse_operations
  WHERE source_table = TG_TABLE_NAME AND source_id = NEW.id;

  -- Écriture via le FinancialEngine (idempotent, tenant-aware)
  PERFORM public.record_caisse_movement(
    p_type            => v_type_operation,
    p_montant         => v_montant,
    p_categorie       => v_categorie,
    p_libelle         => COALESCE(v_libelle, 'Opération automatique'),
    p_source_table    => TG_TABLE_NAME,
    p_source_id       => NEW.id,
    p_beneficiaire_id => v_operateur_id,
    p_reunion_id      => v_reunion_id,
    p_exercice_id     => v_exercice_id,
    p_date_operation  => v_date_operation,
    p_operateur_id    => v_operateur_id
  );

  RETURN NEW;
END;
$$;

-- =============================================================================
-- 3) sync_sanction_to_caisse : délègue à record_caisse_movement
-- =============================================================================
CREATE OR REPLACE FUNCTION public.sync_sanction_to_caisse()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_membre_nom text;
BEGIN
  IF NEW.montant_amende > 0 AND NEW.statut = 'paye' AND (OLD IS NULL OR OLD.statut <> 'paye') THEN
    SELECT CONCAT(prenom, ' ', nom) INTO v_membre_nom FROM membres WHERE id = NEW.membre_id;

    PERFORM public.record_caisse_movement(
      p_type            => 'entree',
      p_montant         => NEW.montant_amende,
      p_categorie       => 'sanction',
      p_libelle         => CONCAT('Amende sanction - ', v_membre_nom, ' - ', COALESCE(NEW.motif, 'Sanction')),
      p_source_table    => 'reunions_sanctions',
      p_source_id       => NEW.id,
      p_beneficiaire_id => NEW.membre_id,
      p_reunion_id      => NEW.reunion_id,
      p_operateur_id    => NEW.membre_id
    );
  END IF;
  RETURN NEW;
END;
$$;

-- =============================================================================
-- 4) sync_reunion_beneficiaire_to_caisse : délègue à record_caisse_movement
-- =============================================================================
CREATE OR REPLACE FUNCTION public.sync_reunion_beneficiaire_to_caisse()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_membre_nom text;
  v_montant numeric;
BEGIN
  IF TG_OP = 'DELETE' THEN
    DELETE FROM fond_caisse_operations
    WHERE source_table = 'reunion_beneficiaires' AND source_id = OLD.id;
    RETURN OLD;
  END IF;

  IF NEW.statut <> 'paye' THEN
    DELETE FROM fond_caisse_operations
    WHERE source_table = 'reunion_beneficiaires' AND source_id = NEW.id;
    RETURN NEW;
  END IF;

  v_montant := COALESCE(NEW.montant_final, NEW.montant_benefice, 0);
  IF v_montant <= 0 THEN
    RETURN NEW;
  END IF;

  SELECT CONCAT(prenom, ' ', nom) INTO v_membre_nom FROM membres WHERE id = NEW.membre_id;

  -- Nettoyage pour tolérer les corrections de montant.
  DELETE FROM fond_caisse_operations
  WHERE source_table = 'reunion_beneficiaires' AND source_id = NEW.id;

  PERFORM public.record_caisse_movement(
    p_type            => 'sortie',
    p_montant         => v_montant,
    p_categorie       => 'beneficiaire',
    p_libelle         => 'Bénéficiaire - ' || COALESCE(v_membre_nom, 'Membre inconnu'),
    p_source_table    => 'reunion_beneficiaires',
    p_source_id       => NEW.id,
    p_beneficiaire_id => NEW.membre_id,
    p_reunion_id      => NEW.reunion_id,
    p_date_operation  => COALESCE(NEW.date_paiement::date, CURRENT_DATE),
    p_operateur_id    => NEW.membre_id
  );

  RETURN NEW;
END;
$$;
