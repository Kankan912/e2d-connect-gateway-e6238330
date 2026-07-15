
-- P0 audit item #3 : centralisation des annulations de mouvements caisse.
-- Objectif : plus aucune suppression directe dans fond_caisse_operations.
-- Cette RPC insère une opération inverse tracée (audit trail conservé).

CREATE OR REPLACE FUNCTION public.reverse_caisse_movement(
  _operation_id uuid,
  _reason text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_op record;
  v_new_id uuid;
  v_type text;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentification requise';
  END IF;

  SELECT * INTO v_op
  FROM public.fond_caisse_operations
  WHERE id = _operation_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Opération introuvable : %', _operation_id;
  END IF;

  -- Idempotence : si une contre-opération existe déjà pour ce mouvement, la renvoyer
  SELECT id INTO v_new_id
  FROM public.fond_caisse_operations
  WHERE source_table = 'fond_caisse_operations_reverse'
    AND source_id = _operation_id
  LIMIT 1;

  IF v_new_id IS NOT NULL THEN
    RETURN v_new_id;
  END IF;

  v_type := CASE WHEN v_op.type_operation = 'entree' THEN 'sortie' ELSE 'entree' END;

  INSERT INTO public.fond_caisse_operations (
    date_operation,
    type_operation,
    montant,
    libelle,
    categorie,
    reunion_id,
    exercice_id,
    source_table,
    source_id,
    beneficiaire_id,
    operateur_id,
    notes,
    justificatif_url
  ) VALUES (
    CURRENT_DATE,
    v_type,
    v_op.montant,
    'ANNULATION — ' || v_op.libelle,
    v_op.categorie,
    v_op.reunion_id,
    v_op.exercice_id,
    'fond_caisse_operations_reverse',
    v_op.id,
    v_op.beneficiaire_id,
    auth.uid(),
    COALESCE(_reason, 'Annulation manuelle'),
    v_op.justificatif_url
  )
  RETURNING id INTO v_new_id;

  RETURN v_new_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.reverse_caisse_movement(uuid, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.reverse_caisse_movement(uuid, text) FROM anon;
