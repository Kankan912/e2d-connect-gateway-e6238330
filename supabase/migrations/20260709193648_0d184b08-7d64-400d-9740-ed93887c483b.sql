-- =====================================================================
-- Phase 3.1 — current_tenant_id() : lit la GUC de session, fallback default
-- =====================================================================
CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_raw text;
  v_id uuid;
BEGIN
  BEGIN
    v_raw := current_setting('app.current_association_id', true);
  EXCEPTION WHEN OTHERS THEN
    v_raw := NULL;
  END;

  IF v_raw IS NOT NULL AND v_raw <> '' THEN
    BEGIN
      v_id := v_raw::uuid;
      RETURN v_id;
    EXCEPTION WHEN OTHERS THEN
      NULL;
    END;
  END IF;

  RETURN public.default_association_id();
END;
$$;

REVOKE ALL ON FUNCTION public.current_tenant_id() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.current_tenant_id() TO authenticated, service_role;

-- =====================================================================
-- Phase 3.1 — has_permission() tenant-aware
-- IMPORTANT : conserver les noms de paramètres actuels (resource_name, perm)
-- pour utiliser CREATE OR REPLACE sans casser les policies dépendantes.
-- =====================================================================
CREATE OR REPLACE FUNCTION public.has_permission(resource_name text, perm text)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_super_admin()
    OR EXISTS (
      SELECT 1
      FROM public.user_roles ur
      JOIN public.roles r ON r.id = ur.role_id
      WHERE ur.user_id = auth.uid()
        AND r.scope = 'platform'
        AND lower(r.name) = 'administrateur'
    )
    OR EXISTS (
      SELECT 1
      FROM public.role_permissions rp
      JOIN public.user_roles ur ON ur.role_id = rp.role_id
      WHERE ur.user_id = auth.uid()
        AND rp.resource = resource_name
        AND rp.permission = perm
        AND rp.granted = true
        AND (
          ur.association_id IS NULL
          OR ur.association_id = public.current_tenant_id()
        )
    );
$$;

-- =====================================================================
-- Phase 3.1 — has_permission_in() : variante explicite
-- =====================================================================
CREATE OR REPLACE FUNCTION public.has_permission_in(
  _association_id uuid,
  _resource text,
  _permission text
)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    public.is_super_admin()
    OR public.is_admin_of(_association_id)
    OR EXISTS (
      SELECT 1
      FROM public.role_permissions rp
      JOIN public.user_roles ur ON ur.role_id = rp.role_id
      WHERE ur.user_id = auth.uid()
        AND rp.resource = _resource
        AND rp.permission = _permission
        AND rp.granted = true
        AND (ur.association_id IS NULL OR ur.association_id = _association_id)
    );
$$;

REVOKE ALL ON FUNCTION public.has_permission_in(uuid, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.has_permission_in(uuid, text, text) TO authenticated, service_role;

-- =====================================================================
-- Phase 3.2 — Backfill role_permissions pour les rôles scope='association'
-- =====================================================================
DO $$
DECLARE
  r RECORD;
  v_template_id uuid;
BEGIN
  FOR r IN
    SELECT id, name, association_id
      FROM public.roles
     WHERE scope = 'association'
       AND NOT EXISTS (SELECT 1 FROM public.role_permissions rp WHERE rp.role_id = roles.id)
  LOOP
    SELECT id INTO v_template_id
      FROM public.roles
     WHERE scope = 'platform'
       AND lower(name) = lower(r.name)
     LIMIT 1;

    IF v_template_id IS NOT NULL THEN
      INSERT INTO public.role_permissions (role_id, resource, permission, granted)
      SELECT r.id, rp.resource, rp.permission, rp.granted
        FROM public.role_permissions rp
       WHERE rp.role_id = v_template_id
      ON CONFLICT DO NOTHING;
    END IF;
  END LOOP;
END $$;

-- =====================================================================
-- Phase 3.3 — Trigger audit_logs.association_id fallback
-- =====================================================================
CREATE OR REPLACE FUNCTION public.audit_logs_fill_association()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.association_id IS NULL THEN
    NEW.association_id := public.current_tenant_id();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_logs_fill_association ON public.audit_logs;
CREATE TRIGGER trg_audit_logs_fill_association
  BEFORE INSERT ON public.audit_logs
  FOR EACH ROW EXECUTE FUNCTION public.audit_logs_fill_association();

-- =====================================================================
-- Phase 3.3 — log_audit() helper standardisé
-- =====================================================================
CREATE OR REPLACE FUNCTION public.log_audit(
  _action text,
  _table_name text,
  _row_id uuid DEFAULT NULL,
  _details jsonb DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  INSERT INTO public.audit_logs (user_id, action, table_name, row_id, details, association_id)
  VALUES (auth.uid(), _action, _table_name, _row_id, _details, public.current_tenant_id())
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

REVOKE ALL ON FUNCTION public.log_audit(text, text, uuid, jsonb) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.log_audit(text, text, uuid, jsonb) TO authenticated, service_role;

-- =====================================================================
-- Phase 3.4 — set_current_association() RPC
-- =====================================================================
CREATE OR REPLACE FUNCTION public.set_current_association(_association_id uuid)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _association_id IS NULL THEN
    PERFORM set_config('app.current_association_id', '', false);
    RETURN NULL;
  END IF;

  IF NOT (public.is_super_admin() OR public.has_association_access(_association_id)) THEN
    RAISE EXCEPTION 'Accès refusé à l''association %', _association_id
      USING ERRCODE = '42501';
  END IF;

  PERFORM set_config('app.current_association_id', _association_id::text, false);
  RETURN _association_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_current_association(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_current_association(uuid) TO authenticated, service_role;

COMMENT ON FUNCTION public.current_tenant_id() IS
  'Phase 3 : retourne le tenant courant (GUC app.current_association_id ou fallback default_association_id).';
COMMENT ON FUNCTION public.has_permission(text, text) IS
  'Phase 3 : vérifie une permission dans le tenant courant. Super_admin et administrateur plateforme court-circuitent.';
COMMENT ON FUNCTION public.has_permission_in(uuid, text, text) IS
  'Phase 3 : variante explicite de has_permission pour un tenant donné.';
COMMENT ON FUNCTION public.set_current_association(uuid) IS
  'Phase 3 : pose la GUC app.current_association_id pour la session (utilisé par le frontend au switch).';