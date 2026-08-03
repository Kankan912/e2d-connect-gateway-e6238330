CREATE OR REPLACE FUNCTION public.get_public_association(_slug text)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'id', a.id,
    'slug', a.slug,
    'nom', a.nom,
    'sigle', a.sigle,
    'description', a.description,
    'logo_url', a.logo_url,
    'theme_tokens', a.theme_tokens,
    'locale', a.locale,
    'langue_principale', a.langue_principale,
    'site_template', a.site_template,
    'subdomain', a.subdomain,
    'email_contact', a.email_contact,
    'telephone', a.telephone,
    'adresse', a.adresse,
    'ville', a.ville,
    'pays', a.pays
  )
  FROM public.associations a
  WHERE a.statut = 'actif'
    AND (lower(a.slug) = lower(_slug) OR lower(a.subdomain) = lower(_slug))
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.get_public_association(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_association(text) TO anon, authenticated, service_role;