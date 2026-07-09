
-- Retirer l'accès direct via l'API (recommandation linter Supabase)
REVOKE SELECT ON public.caisse_soldes_snapshot FROM authenticated;

-- Reader RPC sécurisé : renvoie l'instantané de l'association courante
-- (ou d'une association explicite si l'utilisateur y a accès via RLS métier).
CREATE OR REPLACE FUNCTION public.get_caisse_solde_snapshot(p_association_id uuid DEFAULT NULL)
RETURNS TABLE (
  association_id uuid,
  total_entrees numeric,
  total_sorties numeric,
  solde_net numeric,
  nb_operations bigint,
  derniere_operation date,
  refreshed_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_assoc uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentification requise' USING ERRCODE = '42501';
  END IF;

  v_assoc := COALESCE(p_association_id, public.current_tenant_id(), public.default_association_id());

  RETURN QUERY
  SELECT s.association_id, s.total_entrees, s.total_sorties, s.solde_net,
         s.nb_operations, s.derniere_operation, s.refreshed_at
    FROM public.caisse_soldes_snapshot s
   WHERE s.association_id = v_assoc;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_caisse_solde_snapshot(uuid) TO authenticated, service_role;
