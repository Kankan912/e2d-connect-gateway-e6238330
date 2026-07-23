-- Fix: SUPA_function_search_path_mutable
ALTER FUNCTION public._apply_tenant_rls(text, boolean, boolean, text) SET search_path = public;

-- Fix: SUPA_materialized_view_in_api
REVOKE ALL ON public.caisse_soldes_snapshot FROM anon, authenticated;