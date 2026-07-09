
-- 1. roles : nouvelles colonnes scope + is_system
ALTER TABLE public.roles
  ADD COLUMN IF NOT EXISTS scope text NOT NULL DEFAULT 'association',
  ADD COLUMN IF NOT EXISTS is_system boolean NOT NULL DEFAULT false;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='roles_scope_check') THEN
    ALTER TABLE public.roles ADD CONSTRAINT roles_scope_check CHECK (scope IN ('platform','association'));
  END IF;
END $$;

UPDATE public.roles
   SET scope='platform', is_system=true
 WHERE lower(name) IN ('super_admin','administrateur','membre','admin');

ALTER TABLE public.roles ALTER COLUMN association_id DROP NOT NULL;
UPDATE public.roles SET association_id = NULL WHERE scope = 'platform';

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='roles_scope_association_check') THEN
    ALTER TABLE public.roles ADD CONSTRAINT roles_scope_association_check
      CHECK (
        (scope='platform'    AND association_id IS NULL)
        OR (scope='association' AND association_id IS NOT NULL)
      );
  END IF;
END $$;

INSERT INTO public.roles (name, scope, is_system, association_id, description)
SELECT 'super_admin', 'platform', true, NULL, 'Administrateur de la plateforme (tous tenants)'
WHERE NOT EXISTS (SELECT 1 FROM public.roles WHERE lower(name)='super_admin');

-- 2. user_roles : autoriser association_id NULL + trigger de validation
ALTER TABLE public.user_roles ALTER COLUMN association_id DROP NOT NULL;

CREATE OR REPLACE FUNCTION public.validate_user_role_scope()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_scope text;
BEGIN
  IF NEW.association_id IS NULL THEN
    SELECT scope INTO v_scope FROM public.roles WHERE id = NEW.role_id;
    IF v_scope IS DISTINCT FROM 'platform' THEN
      RAISE EXCEPTION 'user_roles.association_id ne peut être NULL que pour un rôle plateforme (role_id=%)', NEW.role_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_user_role_scope ON public.user_roles;
CREATE TRIGGER trg_validate_user_role_scope
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.validate_user_role_scope();
