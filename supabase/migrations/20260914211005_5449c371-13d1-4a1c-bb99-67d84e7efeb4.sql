
-- ============================================================
-- A07 : dérive de schéma sur reunions.type_reunion (varchar(3))
-- ============================================================
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='reunions'
      AND column_name='type_reunion' AND data_type='character varying'
  ) THEN
    ALTER TABLE public.reunions ALTER COLUMN type_reunion TYPE text;
  END IF;
END$$;

ALTER TABLE public.reunions ALTER COLUMN type_reunion SET DEFAULT 'tontine';

ALTER TABLE public.reunions DROP CONSTRAINT IF EXISTS reunions_type_reunion_check;
ALTER TABLE public.reunions
  ADD CONSTRAINT reunions_type_reunion_check
  CHECK (type_reunion IS NULL OR type_reunion IN ('tontine','bureau','generale','extraordinaire','AGO'));

-- ============================================================
-- Helpers tenant-aware
-- ============================================================
CREATE OR REPLACE FUNCTION public.membre_association_id(_membre_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT m.association_id FROM public.membres m WHERE m.id = _membre_id;
$$;

CREATE OR REPLACE FUNCTION public.reunion_association_id(_reunion_id uuid)
RETURNS uuid LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT r.association_id FROM public.reunions r WHERE r.id = _reunion_id;
$$;

-- Rôle privilégié (admin, trésorier, secrétaire général) dans une association donnée
CREATE OR REPLACE FUNCTION public.has_privileged_role_in(_association_id uuid, _user_id uuid DEFAULT auth.uid())
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public' AS $$
  SELECT public.is_super_admin(_user_id)
      OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON r.id = ur.role_id
        WHERE ur.user_id = _user_id
          AND (ur.association_id = _association_id OR ur.association_id IS NULL)
          AND lower(r.name) IN ('administrateur','admin','tresorier','secretaire_general')
          AND EXISTS (
            SELECT 1 FROM public.get_user_associations(_user_id) aid WHERE aid = _association_id
          )
      );
$$;

GRANT EXECUTE ON FUNCTION public.membre_association_id(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reunion_association_id(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_privileged_role_in(uuid, uuid) TO authenticated, service_role;

-- ============================================================
-- A05/A06 : fermeture des policies USING (true)
-- ============================================================

-- 1. cotisations_membres (parent : membre)
DROP POLICY IF EXISTS cotisations_membres_select_auth ON public.cotisations_membres;
DROP POLICY IF EXISTS cotisations_membres_write_admin ON public.cotisations_membres;
CREATE POLICY cotisations_membres_select_tenant ON public.cotisations_membres
  FOR SELECT TO authenticated
  USING (public.has_association_access(public.membre_association_id(membre_id)));
CREATE POLICY cotisations_membres_write_tenant_admin ON public.cotisations_membres
  FOR ALL TO authenticated
  USING (public.has_privileged_role_in(public.membre_association_id(membre_id)))
  WITH CHECK (public.has_privileged_role_in(public.membre_association_id(membre_id)));

-- 2. cotisations_mensuelles_audit (parent : membre)
DROP POLICY IF EXISTS cotisations_mensuelles_audit_select_auth ON public.cotisations_mensuelles_audit;
DROP POLICY IF EXISTS cotisations_mensuelles_audit_write_admin ON public.cotisations_mensuelles_audit;
CREATE POLICY cotisations_mensuelles_audit_select_tenant ON public.cotisations_mensuelles_audit
  FOR SELECT TO authenticated
  USING (public.has_association_access(public.membre_association_id(membre_id)));
CREATE POLICY cotisations_mensuelles_audit_write_tenant_admin ON public.cotisations_mensuelles_audit
  FOR ALL TO authenticated
  USING (public.has_privileged_role_in(public.membre_association_id(membre_id)))
  WITH CHECK (public.has_privileged_role_in(public.membre_association_id(membre_id)));

-- 3. cotisations_minimales (parent : membre)
DROP POLICY IF EXISTS cotisations_minimales_select_auth ON public.cotisations_minimales;
DROP POLICY IF EXISTS cotisations_minimales_write_admin ON public.cotisations_minimales;
CREATE POLICY cotisations_minimales_select_tenant ON public.cotisations_minimales
  FOR SELECT TO authenticated
  USING (public.has_association_access(public.membre_association_id(membre_id)));
CREATE POLICY cotisations_minimales_write_tenant_admin ON public.cotisations_minimales
  FOR ALL TO authenticated
  USING (public.has_privileged_role_in(public.membre_association_id(membre_id)))
  WITH CHECK (public.has_privileged_role_in(public.membre_association_id(membre_id)));

-- 4. tontine_attributions (parent : membre)
DROP POLICY IF EXISTS tontine_attributions_select_auth ON public.tontine_attributions;
DROP POLICY IF EXISTS tontine_attributions_write_admin ON public.tontine_attributions;
CREATE POLICY tontine_attributions_select_tenant ON public.tontine_attributions
  FOR SELECT TO authenticated
  USING (public.has_association_access(public.membre_association_id(membre_id)));
CREATE POLICY tontine_attributions_write_tenant_admin ON public.tontine_attributions
  FOR ALL TO authenticated
  USING (public.has_privileged_role_in(public.membre_association_id(membre_id)))
  WITH CHECK (public.has_privileged_role_in(public.membre_association_id(membre_id)));

-- 5. activites_membres (parent : membre)
DROP POLICY IF EXISTS activites_membres_select_auth ON public.activites_membres;
DROP POLICY IF EXISTS activites_membres_write_admin ON public.activites_membres;
CREATE POLICY activites_membres_select_tenant ON public.activites_membres
  FOR SELECT TO authenticated
  USING (public.has_association_access(public.membre_association_id(membre_id)));
CREATE POLICY activites_membres_write_tenant_admin ON public.activites_membres
  FOR ALL TO authenticated
  USING (public.has_privileged_role_in(public.membre_association_id(membre_id)))
  WITH CHECK (public.has_privileged_role_in(public.membre_association_id(membre_id)));

-- 6. reunions_huile_savon (parent : réunion)
DROP POLICY IF EXISTS reunions_huile_savon_select_auth ON public.reunions_huile_savon;
DROP POLICY IF EXISTS reunions_huile_savon_write_admin ON public.reunions_huile_savon;
CREATE POLICY reunions_huile_savon_select_tenant ON public.reunions_huile_savon
  FOR SELECT TO authenticated
  USING (public.has_association_access(public.reunion_association_id(reunion_id)));
CREATE POLICY reunions_huile_savon_write_tenant_admin ON public.reunions_huile_savon
  FOR ALL TO authenticated
  USING (public.has_privileged_role_in(public.reunion_association_id(reunion_id)))
  WITH CHECK (public.has_privileged_role_in(public.reunion_association_id(reunion_id)));

-- 7. beneficiaires_paiements_audit (colonne association_id présente)
DROP POLICY IF EXISTS beneficiaires_paiements_audit_select_auth ON public.beneficiaires_paiements_audit;
DROP POLICY IF EXISTS beneficiaires_paiements_audit_write_admin ON public.beneficiaires_paiements_audit;
CREATE POLICY beneficiaires_paiements_audit_select_tenant ON public.beneficiaires_paiements_audit
  FOR SELECT TO authenticated
  USING (public.has_association_access(COALESCE(association_id, public.membre_association_id(membre_id))));
CREATE POLICY beneficiaires_paiements_audit_write_tenant_admin ON public.beneficiaires_paiements_audit
  FOR ALL TO authenticated
  USING (public.has_privileged_role_in(COALESCE(association_id, public.membre_association_id(membre_id))))
  WITH CHECK (public.has_privileged_role_in(COALESCE(association_id, public.membre_association_id(membre_id))));
