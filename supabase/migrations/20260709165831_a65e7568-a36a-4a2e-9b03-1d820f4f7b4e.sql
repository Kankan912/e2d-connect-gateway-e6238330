
CREATE OR REPLACE FUNCTION public.provision_user_account(
  p_user_id    uuid,
  p_email      text,
  p_nom        text,
  p_prenom     text,
  p_telephone  text,
  p_role_ids   uuid[],
  p_membre_id  uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_role_ids       uuid[];
  v_default_role   uuid;
  v_membre_user    uuid;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id required' USING ERRCODE = '22023';
  END IF;

  -- 1) Update profile (row is created by handle_new_user trigger)
  UPDATE public.profiles
     SET nom = p_nom,
         prenom = p_prenom,
         email = p_email,
         telephone = p_telephone,
         must_change_password = true,
         password_changed = false,
         updated_at = now()
   WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile_not_found' USING ERRCODE = 'P0002';
  END IF;

  -- 2) Resolve role list (default = 'membre' if none provided)
  IF p_role_ids IS NULL OR array_length(p_role_ids, 1) IS NULL THEN
    SELECT id INTO v_default_role
      FROM public.roles
     WHERE lower(name) = 'membre'
     LIMIT 1;
    IF v_default_role IS NOT NULL THEN
      v_role_ids := ARRAY[v_default_role];
    ELSE
      v_role_ids := ARRAY[]::uuid[];
    END IF;
  ELSE
    v_role_ids := p_role_ids;
  END IF;

  -- 3) Insert user_roles (idempotent)
  IF array_length(v_role_ids, 1) IS NOT NULL THEN
    INSERT INTO public.user_roles (user_id, role_id)
    SELECT p_user_id, r
      FROM unnest(v_role_ids) AS r
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END IF;

  -- 4) Link membre + insert membres_roles
  IF p_membre_id IS NOT NULL THEN
    SELECT user_id INTO v_membre_user
      FROM public.membres
     WHERE id = p_membre_id
     FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'membre_not_found' USING ERRCODE = 'P0002';
    END IF;

    IF v_membre_user IS NOT NULL AND v_membre_user <> p_user_id THEN
      RAISE EXCEPTION 'membre_already_linked' USING ERRCODE = '23505';
    END IF;

    UPDATE public.membres
       SET user_id = p_user_id,
           updated_at = now()
     WHERE id = p_membre_id;

    IF array_length(v_role_ids, 1) IS NOT NULL THEN
      INSERT INTO public.membres_roles (membre_id, role_id)
      SELECT p_membre_id, r
        FROM unnest(v_role_ids) AS r
      ON CONFLICT (membre_id, role_id) DO NOTHING;
    END IF;
  END IF;

  -- 5) Audit log
  INSERT INTO public.audit_logs (action, table_name, record_id, user_id, new_data)
  VALUES (
    'user_provisioned',
    'profiles',
    p_user_id,
    p_user_id,
    jsonb_build_object(
      'email', p_email,
      'role_ids', to_jsonb(v_role_ids),
      'membre_id', p_membre_id
    )
  );

  RETURN jsonb_build_object(
    'user_id', p_user_id,
    'role_ids', to_jsonb(v_role_ids),
    'membre_id', p_membre_id
  );
END;
$$;

-- Lock down: only edge functions (service_role) can call this.
REVOKE ALL ON FUNCTION public.provision_user_account(uuid, text, text, text, text, uuid[], uuid) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.provision_user_account(uuid, text, text, text, text, uuid[], uuid) FROM anon, authenticated;
GRANT EXECUTE ON FUNCTION public.provision_user_account(uuid, text, text, text, text, uuid[], uuid) TO service_role;

COMMENT ON FUNCTION public.provision_user_account(uuid, text, text, text, text, uuid[], uuid)
  IS 'Transactional post-signup provisioning: profile update, roles, membre link, audit log. Called by edge function create-user-account with service_role only.';

-- Ensure unique constraint used by ON CONFLICT above exists (idempotent guard)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'membres_roles_membre_id_role_id_key'
  ) THEN
    ALTER TABLE public.membres_roles
      ADD CONSTRAINT membres_roles_membre_id_role_id_key UNIQUE (membre_id, role_id);
  END IF;
END $$;
