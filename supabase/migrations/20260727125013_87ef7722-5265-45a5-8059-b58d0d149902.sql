-- ============================================================
-- LOT A-bis — Verrouillage auto cotisations soldées + plafond
--             cotisations mensuelles par membre
-- ============================================================

-- 1. Verrouillage automatique des cotisations soldées
CREATE OR REPLACE FUNCTION public.enforce_cotisation_lock()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_admin BOOLEAN := FALSE;
BEGIN
  BEGIN
    v_is_admin := public.is_admin_of(COALESCE(NEW.association_id, OLD.association_id));
  EXCEPTION WHEN OTHERS THEN
    v_is_admin := FALSE;
  END;

  IF TG_OP = 'DELETE' THEN
    IF COALESCE(OLD.verrouille, FALSE) AND NOT v_is_admin THEN
      RAISE EXCEPTION 'Cotisation verrouillée (soldée) : suppression interdite. Déverrouillez-la d''abord.';
    END IF;
    RETURN OLD;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    -- Blocage des modifications de fond sur une cotisation verrouillée
    IF COALESCE(OLD.verrouille, FALSE)
       AND COALESCE(NEW.verrouille, FALSE)
       AND NOT v_is_admin
       AND (
         OLD.montant IS DISTINCT FROM NEW.montant
         OR OLD.statut IS DISTINCT FROM NEW.statut
         OR OLD.membre_id IS DISTINCT FROM NEW.membre_id
         OR OLD.type_cotisation_id IS DISTINCT FROM NEW.type_cotisation_id
         OR OLD.exercice_id IS DISTINCT FROM NEW.exercice_id
       )
    THEN
      RAISE EXCEPTION 'Cotisation verrouillée (soldée) : modification interdite. Déverrouillez-la d''abord.';
    END IF;
  END IF;

  -- Auto-verrouillage dès que la cotisation est soldée
  IF NEW.statut = 'paye' AND COALESCE(NEW.montant, 0) > 0 THEN
    IF NOT COALESCE(NEW.verrouille, FALSE) THEN
      NEW.verrouille := TRUE;
      NEW.verrouille_le := now();
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_cotisation_lock ON public.cotisations;
CREATE TRIGGER trg_enforce_cotisation_lock
  BEFORE INSERT OR UPDATE OR DELETE ON public.cotisations
  FOR EACH ROW EXECUTE FUNCTION public.enforce_cotisation_lock();

-- Backfill : les cotisations déjà soldées deviennent verrouillées
UPDATE public.cotisations
   SET verrouille = TRUE,
       verrouille_le = COALESCE(verrouille_le, now())
 WHERE statut = 'paye'
   AND COALESCE(verrouille, FALSE) = FALSE;

-- 2. Plafond de cotisations mensuelles actives par membre / exercice
CREATE OR REPLACE FUNCTION public.enforce_max_cotisations_mensuelles()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_max INTEGER := 1;
  v_autorise BOOLEAN := FALSE;
  v_count INTEGER := 0;
BEGIN
  IF NOT COALESCE(NEW.actif, TRUE) THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(MAX(max_cotisations_mensuelles_par_membre), 1)
    INTO v_max
    FROM public.association_settings
   WHERE association_id = NEW.association_id;

  SELECT COALESCE(autoriser_plusieurs_cotisations_mensuelles, FALSE)
    INTO v_autorise
    FROM public.membres
   WHERE id = NEW.membre_id;

  IF COALESCE(v_autorise, FALSE) THEN
    RETURN NEW;
  END IF;

  SELECT COUNT(*)
    INTO v_count
    FROM public.cotisations_mensuelles_exercice
   WHERE membre_id = NEW.membre_id
     AND exercice_id = NEW.exercice_id
     AND actif = TRUE
     AND id IS DISTINCT FROM NEW.id;

  IF v_count >= COALESCE(v_max, 1) THEN
    RAISE EXCEPTION 'Plafond atteint : % cotisation(s) mensuelle(s) active(s) maximum par membre pour cet exercice. Autorisez explicitement le membre pour dépasser ce plafond.', COALESCE(v_max, 1);
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_max_cotisations_mensuelles ON public.cotisations_mensuelles_exercice;
CREATE TRIGGER trg_enforce_max_cotisations_mensuelles
  BEFORE INSERT OR UPDATE ON public.cotisations_mensuelles_exercice
  FOR EACH ROW EXECUTE FUNCTION public.enforce_max_cotisations_mensuelles();
