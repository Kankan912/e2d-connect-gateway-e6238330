
-- ============================================================================
-- Phase 4.5 — Vue matérialisée caisse_soldes_snapshot
-- Agrégats caisse par association pour éviter le recalcul à chaque requête.
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS public.caisse_soldes_snapshot AS
SELECT
  association_id,
  COALESCE(SUM(CASE WHEN type_operation = 'entree' THEN montant ELSE 0 END), 0) AS total_entrees,
  COALESCE(SUM(CASE WHEN type_operation = 'sortie' THEN montant ELSE 0 END), 0) AS total_sorties,
  COALESCE(SUM(CASE WHEN type_operation = 'entree' THEN montant ELSE -montant END), 0) AS solde_net,
  COUNT(*) AS nb_operations,
  MAX(date_operation) AS derniere_operation,
  now() AS refreshed_at
FROM public.fond_caisse_operations
GROUP BY association_id;

-- Index unique requis pour REFRESH CONCURRENTLY
CREATE UNIQUE INDEX IF NOT EXISTS idx_caisse_soldes_snapshot_assoc
  ON public.caisse_soldes_snapshot (association_id);

-- Vue matérialisée : GRANT s'applique via la vue elle-même
GRANT SELECT ON public.caisse_soldes_snapshot TO authenticated;
GRANT ALL   ON public.caisse_soldes_snapshot TO service_role;

-- ---------------------------------------------------------------------------
-- RPC de rafraîchissement (idempotente, CONCURRENTLY quand possible)
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.refresh_caisse_soldes_snapshot()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  BEGIN
    REFRESH MATERIALIZED VIEW CONCURRENTLY public.caisse_soldes_snapshot;
  EXCEPTION WHEN OTHERS THEN
    -- Fallback (première exécution : la vue peut être vide)
    REFRESH MATERIALIZED VIEW public.caisse_soldes_snapshot;
  END;
END;
$$;

GRANT EXECUTE ON FUNCTION public.refresh_caisse_soldes_snapshot() TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Trigger de rafraîchissement asynchrone : on marque un besoin, on ne bloque pas
-- la transaction métier. Le rafraîchissement effectif est déclenché
-- côté client/edge fn via refresh_caisse_soldes_snapshot() au bon moment.
-- ---------------------------------------------------------------------------
-- (Pas de trigger AFTER pour éviter de sérialiser toutes les écritures caisse.)

-- Rafraîchissement initial
SELECT public.refresh_caisse_soldes_snapshot();
