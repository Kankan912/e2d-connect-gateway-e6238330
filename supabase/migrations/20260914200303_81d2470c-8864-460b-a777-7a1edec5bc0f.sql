ALTER TABLE public.site_config DROP CONSTRAINT IF EXISTS site_config_cle_key;
CREATE UNIQUE INDEX IF NOT EXISTS site_config_assoc_cle_key ON public.site_config (association_id, cle);