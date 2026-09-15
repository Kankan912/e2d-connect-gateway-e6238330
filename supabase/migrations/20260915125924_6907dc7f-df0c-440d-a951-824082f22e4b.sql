REVOKE EXECUTE ON FUNCTION public.cloturer_reunion(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.rouvrir_reunion(uuid, boolean, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cloturer_reunion(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rouvrir_reunion(uuid, boolean, text) TO authenticated;