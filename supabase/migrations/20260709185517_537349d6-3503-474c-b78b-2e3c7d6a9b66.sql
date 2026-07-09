
CREATE OR REPLACE FUNCTION public.is_super_admin(_user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles ur
    JOIN public.roles r ON r.id = ur.role_id
    WHERE ur.user_id = _user_id
      AND lower(r.name) = 'super_admin'
      AND r.scope = 'platform'
  );
$$;

CREATE OR REPLACE FUNCTION public.get_user_associations(_user_id uuid DEFAULT auth.uid())
RETURNS SETOF uuid
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT DISTINCT ur.association_id
    FROM public.user_roles ur
   WHERE ur.user_id = _user_id AND ur.association_id IS NOT NULL
  UNION
  SELECT DISTINCT m.association_id
    FROM public.membres m
   WHERE m.user_id = _user_id
     AND m.association_id IS NOT NULL
     AND COALESCE(m.statut, 'actif') <> 'supprime'
  UNION
  SELECT id FROM public.associations WHERE public.is_super_admin(_user_id);
$$;

CREATE OR REPLACE FUNCTION public.has_association_access(_association_id uuid, _user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_super_admin(_user_id)
      OR EXISTS (SELECT 1 FROM public.get_user_associations(_user_id) aid WHERE aid = _association_id);
$$;

CREATE OR REPLACE FUNCTION public.is_admin_of(_association_id uuid, _user_id uuid DEFAULT auth.uid())
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT public.is_super_admin(_user_id)
      OR EXISTS (
        SELECT 1 FROM public.user_roles ur
        JOIN public.roles r ON r.id = ur.role_id
        WHERE ur.user_id = _user_id
          AND ur.association_id = _association_id
          AND lower(r.name) IN ('administrateur','admin')
      );
$$;
