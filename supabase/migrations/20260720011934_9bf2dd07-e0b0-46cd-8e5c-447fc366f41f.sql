
-- ============================================================
-- LOT A — Cotisations par exercice & moteur de paiement
-- ============================================================

-- 1. Table de paramétrage des cotisations par exercice
CREATE TABLE IF NOT EXISTS public.exercise_contribution_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  association_id UUID NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  exercice_id UUID NOT NULL REFERENCES public.exercices(id) ON DELETE CASCADE,
  type_cotisation TEXT NOT NULL,
  montant NUMERIC(14,2) NOT NULL CHECK (montant >= 0),
  date_effet DATE NOT NULL DEFAULT CURRENT_DATE,
  actif BOOLEAN NOT NULL DEFAULT TRUE,
  notes TEXT,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (association_id, exercice_id, type_cotisation, date_effet)
);

CREATE INDEX IF NOT EXISTS idx_ecs_association_exercice
  ON public.exercise_contribution_settings (association_id, exercice_id, actif);

GRANT SELECT ON public.exercise_contribution_settings TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.exercise_contribution_settings TO authenticated;
GRANT ALL ON public.exercise_contribution_settings TO service_role;

ALTER TABLE public.exercise_contribution_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ecs_select_tenant"
  ON public.exercise_contribution_settings FOR SELECT
  TO authenticated
  USING (association_id = public.current_association_id());

CREATE POLICY "ecs_write_admin"
  ON public.exercise_contribution_settings FOR ALL
  TO authenticated
  USING (
    association_id = public.current_association_id()
    AND (public.is_admin_of(association_id) OR public.has_permission('cotisations', 'update'))
  )
  WITH CHECK (
    association_id = public.current_association_id()
    AND (public.is_admin_of(association_id) OR public.has_permission('cotisations', 'update'))
  );

-- Historisation
CREATE TABLE IF NOT EXISTS public.exercise_contribution_settings_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  setting_id UUID NOT NULL,
  association_id UUID NOT NULL,
  exercice_id UUID NOT NULL,
  type_cotisation TEXT NOT NULL,
  ancien_montant NUMERIC(14,2),
  nouveau_montant NUMERIC(14,2),
  action TEXT NOT NULL,
  modifie_par UUID REFERENCES auth.users(id),
  modifie_le TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.exercise_contribution_settings_history TO authenticated;
GRANT ALL ON public.exercise_contribution_settings_history TO service_role;

ALTER TABLE public.exercise_contribution_settings_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ecs_history_select_admin"
  ON public.exercise_contribution_settings_history FOR SELECT
  TO authenticated
  USING (
    association_id = public.current_association_id()
    AND public.is_admin_of(association_id)
  );

CREATE POLICY "ecs_history_insert_system"
  ON public.exercise_contribution_settings_history FOR INSERT
  TO authenticated
  WITH CHECK (association_id = public.current_association_id());

CREATE OR REPLACE FUNCTION public.log_ecs_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    INSERT INTO public.exercise_contribution_settings_history
      (setting_id, association_id, exercice_id, type_cotisation, nouveau_montant, action, modifie_par)
    VALUES (NEW.id, NEW.association_id, NEW.exercice_id, NEW.type_cotisation, NEW.montant, 'CREATE', auth.uid());
    RETURN NEW;
  ELSIF (TG_OP = 'UPDATE') THEN
    IF OLD.montant IS DISTINCT FROM NEW.montant OR OLD.actif IS DISTINCT FROM NEW.actif THEN
      INSERT INTO public.exercise_contribution_settings_history
        (setting_id, association_id, exercice_id, type_cotisation, ancien_montant, nouveau_montant, action, modifie_par)
      VALUES (NEW.id, NEW.association_id, NEW.exercice_id, NEW.type_cotisation, OLD.montant, NEW.montant, 'UPDATE', auth.uid());
    END IF;
    NEW.updated_at := now();
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    INSERT INTO public.exercise_contribution_settings_history
      (setting_id, association_id, exercice_id, type_cotisation, ancien_montant, action, modifie_par)
    VALUES (OLD.id, OLD.association_id, OLD.exercice_id, OLD.type_cotisation, OLD.montant, 'DELETE', auth.uid());
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_ecs_history ON public.exercise_contribution_settings;
CREATE TRIGGER trg_ecs_history
  AFTER INSERT OR UPDATE OR DELETE ON public.exercise_contribution_settings
  FOR EACH ROW EXECUTE FUNCTION public.log_ecs_change();

-- 2. Verrouillage auto des cotisations soldées
ALTER TABLE public.cotisations
  ADD COLUMN IF NOT EXISTS verrouille BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS verrouille_le TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS verrouille_motif TEXT;

-- 3. Multi-cotisations mensuelles
ALTER TABLE public.membres
  ADD COLUMN IF NOT EXISTS autoriser_plusieurs_cotisations_mensuelles BOOLEAN NOT NULL DEFAULT FALSE;

ALTER TABLE public.association_settings
  ADD COLUMN IF NOT EXISTS max_cotisations_mensuelles_par_membre INTEGER NOT NULL DEFAULT 1
    CHECK (max_cotisations_mensuelles_par_membre >= 1);

-- 4. RPC déverrouillage cotisation (admin uniquement)
CREATE OR REPLACE FUNCTION public.unlock_cotisation(
  _cotisation_id UUID,
  _motif TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_assoc UUID;
BEGIN
  IF _motif IS NULL OR length(trim(_motif)) < 5 THEN
    RAISE EXCEPTION 'Motif obligatoire (min 5 caractères)';
  END IF;

  SELECT association_id INTO v_assoc
  FROM public.cotisations WHERE id = _cotisation_id;

  IF v_assoc IS NULL THEN
    RAISE EXCEPTION 'Cotisation introuvable';
  END IF;

  IF NOT public.is_admin_of(v_assoc) THEN
    RAISE EXCEPTION 'Accès refusé : administrateur requis';
  END IF;

  UPDATE public.cotisations
     SET verrouille = FALSE,
         verrouille_le = NULL,
         verrouille_motif = _motif
   WHERE id = _cotisation_id;

  -- Audit trail
  BEGIN
    PERFORM public.log_audit('cotisation_unlock', 'cotisations', _cotisation_id::text,
      jsonb_build_object('motif', _motif));
  EXCEPTION WHEN OTHERS THEN
    -- log_audit optional
    NULL;
  END;

  RETURN TRUE;
END;
$$;

REVOKE ALL ON FUNCTION public.unlock_cotisation(UUID, TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.unlock_cotisation(UUID, TEXT) TO authenticated;
