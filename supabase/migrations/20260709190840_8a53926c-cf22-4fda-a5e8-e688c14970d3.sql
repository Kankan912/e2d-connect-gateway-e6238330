
-- Helper interne pour appliquer le patron RLS tenant-aware
-- SUPPRIME toutes les policies existantes sur la table, puis crée 4 policies standards
CREATE OR REPLACE FUNCTION public._apply_tenant_rls(
  _table text,
  _admin_write boolean DEFAULT true,
  _public_select boolean DEFAULT false,
  _public_select_cond text DEFAULT 'true'
)
RETURNS void
LANGUAGE plpgsql
AS $$
DECLARE
  r record;
  qualified text := format('public.%I', _table);
  write_expr text;
  select_expr text;
BEGIN
  -- Drop toutes les policies existantes
  FOR r IN
    SELECT policyname FROM pg_policies
    WHERE schemaname='public' AND tablename=_table
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %s', r.policyname, qualified);
  END LOOP;

  -- SELECT
  IF _public_select THEN
    EXECUTE format(
      'CREATE POLICY tenant_select_%1$s ON %2$s FOR SELECT USING (%3$s OR public.has_association_access(association_id) OR public.is_super_admin())',
      _table, qualified, _public_select_cond
    );
  ELSE
    EXECUTE format(
      'CREATE POLICY tenant_select_%1$s ON %2$s FOR SELECT TO authenticated USING (public.has_association_access(association_id) OR public.is_super_admin())',
      _table, qualified
    );
  END IF;

  -- INSERT/UPDATE/DELETE
  IF _admin_write THEN
    write_expr := '(public.is_admin_of(association_id) OR public.is_super_admin())';
  ELSE
    write_expr := '(public.has_association_access(association_id) OR public.is_super_admin())';
  END IF;

  EXECUTE format(
    'CREATE POLICY tenant_insert_%1$s ON %2$s FOR INSERT TO authenticated WITH CHECK %3$s',
    _table, qualified, write_expr
  );
  EXECUTE format(
    'CREATE POLICY tenant_update_%1$s ON %2$s FOR UPDATE TO authenticated USING %3$s WITH CHECK %3$s',
    _table, qualified, write_expr
  );
  EXECUTE format(
    'CREATE POLICY tenant_delete_%1$s ON %2$s FOR DELETE TO authenticated USING %3$s',
    _table, qualified, write_expr
  );

  -- service_role bypass
  EXECUTE format(
    'CREATE POLICY tenant_service_%1$s ON %2$s FOR ALL TO service_role USING (true) WITH CHECK (true)',
    _table, qualified
  );
END;
$$;

COMMENT ON FUNCTION public._apply_tenant_rls IS
  'Interne Phase 2.4 : applique le patron RLS tenant-aware standard sur une table possédant une colonne association_id.';
