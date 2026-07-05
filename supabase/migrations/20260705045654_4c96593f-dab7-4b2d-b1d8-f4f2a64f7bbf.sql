CREATE POLICY "membres_select_authenticated"
  ON public.membres FOR SELECT TO authenticated USING (true);

CREATE POLICY "membres_insert_admin"
  ON public.membres FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "membres_update_admin"
  ON public.membres FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "membres_delete_admin"
  ON public.membres FOR DELETE TO authenticated USING (public.is_admin());