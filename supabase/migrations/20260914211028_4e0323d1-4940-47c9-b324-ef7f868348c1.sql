
REVOKE ALL ON FUNCTION public.membre_association_id(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.reunion_association_id(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_privileged_role_in(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.membre_association_id(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.reunion_association_id(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_privileged_role_in(uuid, uuid) TO authenticated, service_role;
