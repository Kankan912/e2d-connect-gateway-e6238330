-- Recreate missing RLS policies on cotisations_mensuelles_exercice + audit
DROP POLICY IF EXISTS "cme_select_own_or_admin" ON public.cotisations_mensuelles_exercice;
DROP POLICY IF EXISTS "cme_insert_authorized" ON public.cotisations_mensuelles_exercice;
DROP POLICY IF EXISTS "cme_update_authorized" ON public.cotisations_mensuelles_exercice;
DROP POLICY IF EXISTS "cme_delete_authorized" ON public.cotisations_mensuelles_exercice;

CREATE POLICY "cme_select_own_or_admin"
  ON public.cotisations_mensuelles_exercice FOR SELECT
  TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.membres m
      WHERE m.id = cotisations_mensuelles_exercice.membre_id
        AND m.user_id = auth.uid()
    )
  );

CREATE POLICY "cme_insert_authorized"
  ON public.cotisations_mensuelles_exercice FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin() OR public.has_permission('cotisations','update'));

CREATE POLICY "cme_update_authorized"
  ON public.cotisations_mensuelles_exercice FOR UPDATE
  TO authenticated
  USING (public.is_admin() OR public.has_permission('cotisations','update'))
  WITH CHECK (public.is_admin() OR public.has_permission('cotisations','update'));

CREATE POLICY "cme_delete_authorized"
  ON public.cotisations_mensuelles_exercice FOR DELETE
  TO authenticated
  USING (public.is_admin() OR public.has_permission('cotisations','delete'));

-- Audit table
DROP POLICY IF EXISTS "cma_select_authorized" ON public.cotisations_mensuelles_audit;
DROP POLICY IF EXISTS "cma_insert_authorized" ON public.cotisations_mensuelles_audit;

CREATE POLICY "cma_select_authorized"
  ON public.cotisations_mensuelles_audit FOR SELECT
  TO authenticated
  USING (public.is_admin() OR public.has_permission('cotisations','update'));

CREATE POLICY "cma_insert_authorized"
  ON public.cotisations_mensuelles_audit FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() IS NOT NULL
    AND (public.is_admin() OR public.has_permission('cotisations','update'))
  );

-- Ensure trigger forcing modifie_par = auth.uid()
CREATE OR REPLACE FUNCTION public.cma_force_modifie_par()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.modifie_par := auth.uid();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_cma_force_modifie_par ON public.cotisations_mensuelles_audit;
CREATE TRIGGER trg_cma_force_modifie_par
  BEFORE INSERT ON public.cotisations_mensuelles_audit
  FOR EACH ROW EXECUTE FUNCTION public.cma_force_modifie_par();