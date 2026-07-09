
-- ============================================================
-- PHASE 2.4.1 — RLS tenant-aware : membres & auth
-- ============================================================

-- 1. Helpers additionnels
CREATE OR REPLACE FUNCTION public.current_association_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT association_id FROM public.membres WHERE user_id = auth.uid() LIMIT 1),
    public.default_association_id()
  );
$$;

CREATE OR REPLACE FUNCTION public.can_view_profile(_profile_id uuid, _viewer uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    _profile_id = _viewer
    OR public.is_super_admin(_viewer)
    OR EXISTS (
      SELECT 1
      FROM public.membres m_target
      JOIN public.membres m_viewer ON m_viewer.association_id = m_target.association_id
      WHERE m_target.user_id = _profile_id
        AND m_viewer.user_id = _viewer
    );
$$;

-- ============================================================
-- 2. TABLE : membres
-- ============================================================
DROP POLICY IF EXISTS "membres_select_authenticated" ON public.membres;
DROP POLICY IF EXISTS "membres_insert_admin" ON public.membres;
DROP POLICY IF EXISTS "membres_update_admin" ON public.membres;
DROP POLICY IF EXISTS "membres_delete_admin" ON public.membres;

CREATE POLICY "tenant_select_membres" ON public.membres
  FOR SELECT TO authenticated
  USING (public.has_association_access(association_id) OR public.is_super_admin());

CREATE POLICY "tenant_insert_membres" ON public.membres
  FOR INSERT TO authenticated
  WITH CHECK (
    (public.is_admin_of(association_id) OR public.is_super_admin())
  );

CREATE POLICY "tenant_update_membres" ON public.membres
  FOR UPDATE TO authenticated
  USING (public.is_admin_of(association_id) OR public.is_super_admin())
  WITH CHECK (public.is_admin_of(association_id) OR public.is_super_admin());

CREATE POLICY "tenant_delete_membres" ON public.membres
  FOR DELETE TO authenticated
  USING (public.is_admin_of(association_id) OR public.is_super_admin());

-- ============================================================
-- 3. TABLE : profiles
-- ============================================================
DROP POLICY IF EXISTS "Les utilisateurs peuvent créer leur profil" ON public.profiles;
DROP POLICY IF EXISTS "Les utilisateurs peuvent modifier leur propre profil" ON public.profiles;
DROP POLICY IF EXISTS "Les utilisateurs peuvent voir leur propre profil" ON public.profiles;
DROP POLICY IF EXISTS "Users can manage own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "profiles_self_update" ON public.profiles;

CREATE POLICY "tenant_select_profiles" ON public.profiles
  FOR SELECT TO authenticated
  USING (public.can_view_profile(id));

CREATE POLICY "tenant_insert_profiles" ON public.profiles
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = id OR public.is_admin_of(association_id) OR public.is_super_admin());

CREATE POLICY "tenant_update_profiles" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = id OR public.is_admin_of(association_id) OR public.is_super_admin())
  WITH CHECK (auth.uid() = id OR public.is_admin_of(association_id) OR public.is_super_admin());

CREATE POLICY "tenant_delete_profiles" ON public.profiles
  FOR DELETE TO authenticated
  USING (public.is_admin_of(association_id) OR public.is_super_admin());

-- ============================================================
-- 4. TABLE : user_roles
-- ============================================================
DROP POLICY IF EXISTS "service_role_all_user_roles" ON public.user_roles;
DROP POLICY IF EXISTS "view_own_user_role" ON public.user_roles;

CREATE POLICY "user_roles_service_all" ON public.user_roles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "user_roles_select_self_or_admin" ON public.user_roles
  FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.membres m
      WHERE m.user_id = user_roles.user_id
        AND public.is_admin_of(m.association_id)
    )
  );

CREATE POLICY "user_roles_insert_admin" ON public.user_roles
  FOR INSERT TO authenticated
  WITH CHECK (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.membres m
      WHERE m.user_id = user_roles.user_id
        AND public.is_admin_of(m.association_id)
    )
  );

CREATE POLICY "user_roles_update_admin" ON public.user_roles
  FOR UPDATE TO authenticated
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.membres m
      WHERE m.user_id = user_roles.user_id
        AND public.is_admin_of(m.association_id)
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.membres m
      WHERE m.user_id = user_roles.user_id
        AND public.is_admin_of(m.association_id)
    )
  );

CREATE POLICY "user_roles_delete_admin" ON public.user_roles
  FOR DELETE TO authenticated
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.membres m
      WHERE m.user_id = user_roles.user_id
        AND public.is_admin_of(m.association_id)
    )
  );

-- ============================================================
-- 5. TABLE : membres_roles
-- ============================================================
DROP POLICY IF EXISTS "Utilisateurs peuvent voir les rôles des membres" ON public.membres_roles;

CREATE POLICY "tenant_select_membres_roles" ON public.membres_roles
  FOR SELECT TO authenticated
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.membres m
      WHERE m.id = membres_roles.membre_id
        AND public.has_association_access(m.association_id)
    )
  );

CREATE POLICY "tenant_write_membres_roles" ON public.membres_roles
  FOR ALL TO authenticated
  USING (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.membres m
      WHERE m.id = membres_roles.membre_id
        AND public.is_admin_of(m.association_id)
    )
  )
  WITH CHECK (
    public.is_super_admin()
    OR EXISTS (
      SELECT 1 FROM public.membres m
      WHERE m.id = membres_roles.membre_id
        AND public.is_admin_of(m.association_id)
    )
  );

-- ============================================================
-- 6. TABLE : roles (scope platform vs association)
-- ============================================================
DROP POLICY IF EXISTS "Tout utilisateur authentifié peut voir les rôles" ON public.roles;

CREATE POLICY "roles_select_scope" ON public.roles
  FOR SELECT TO authenticated
  USING (
    scope = 'platform'
    OR public.is_super_admin()
    OR (association_id IS NOT NULL AND public.has_association_access(association_id))
  );

CREATE POLICY "roles_write_admin" ON public.roles
  FOR ALL TO authenticated
  USING (
    public.is_super_admin()
    OR (scope = 'association' AND association_id IS NOT NULL AND public.is_admin_of(association_id))
  )
  WITH CHECK (
    is_system = false
    AND (
      public.is_super_admin()
      OR (scope = 'association' AND association_id IS NOT NULL AND public.is_admin_of(association_id))
    )
  );

-- ============================================================
-- 7. TABLE : role_permissions
-- ============================================================
DROP POLICY IF EXISTS "Tous peuvent voir permissions" ON public.role_permissions;

CREATE POLICY "role_permissions_select" ON public.role_permissions
  FOR SELECT TO authenticated
  USING (
    association_id IS NULL
    OR public.has_association_access(association_id)
    OR public.is_super_admin()
  );

CREATE POLICY "role_permissions_write_admin" ON public.role_permissions
  FOR ALL TO authenticated
  USING (
    public.is_super_admin()
    OR (association_id IS NOT NULL AND public.is_admin_of(association_id))
  )
  WITH CHECK (
    public.is_super_admin()
    OR (association_id IS NOT NULL AND public.is_admin_of(association_id))
  );
