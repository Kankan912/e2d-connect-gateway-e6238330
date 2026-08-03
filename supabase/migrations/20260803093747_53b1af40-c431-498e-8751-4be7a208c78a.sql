DROP POLICY IF EXISTS associations_select ON public.associations;
DROP POLICY IF EXISTS associations_insert ON public.associations;
DROP POLICY IF EXISTS associations_update ON public.associations;
DROP POLICY IF EXISTS associations_delete ON public.associations;
DROP POLICY IF EXISTS associations_service ON public.associations;

CREATE POLICY associations_select ON public.associations
  FOR SELECT TO authenticated
  USING (public.has_association_access(id) OR public.is_super_admin());

CREATE POLICY associations_update ON public.associations
  FOR UPDATE TO authenticated
  USING (public.is_admin_of(id) OR public.is_super_admin())
  WITH CHECK (public.is_admin_of(id) OR public.is_super_admin());

CREATE POLICY associations_insert ON public.associations
  FOR INSERT TO authenticated
  WITH CHECK (public.is_super_admin());

CREATE POLICY associations_delete ON public.associations
  FOR DELETE TO authenticated
  USING (public.is_super_admin());

CREATE POLICY associations_service ON public.associations
  FOR ALL TO service_role
  USING (true) WITH CHECK (true);