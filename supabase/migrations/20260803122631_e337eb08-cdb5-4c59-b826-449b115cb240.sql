ALTER TABLE public.associations
  ADD COLUMN IF NOT EXISTS sigle text,
  ADD COLUMN IF NOT EXISTS email_contact text,
  ADD COLUMN IF NOT EXISTS telephone text,
  ADD COLUMN IF NOT EXISTS adresse text,
  ADD COLUMN IF NOT EXISTS ville text,
  ADD COLUMN IF NOT EXISTS pays text,
  ADD COLUMN IF NOT EXISTS site_template text NOT NULL DEFAULT 'institutionnel',
  ADD COLUMN IF NOT EXISTS subdomain text,
  ADD COLUMN IF NOT EXISTS langue_principale text NOT NULL DEFAULT 'fr';

UPDATE public.associations SET subdomain = slug WHERE subdomain IS NULL;
UPDATE public.associations SET langue_principale = COALESCE(NULLIF(split_part(locale,'-',1),''),'fr');

CREATE UNIQUE INDEX IF NOT EXISTS associations_subdomain_key ON public.associations (lower(subdomain));

CREATE OR REPLACE FUNCTION public.audit_associations_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, table_name, record_id, old_data, new_data, association_id)
  VALUES (
    auth.uid(),
    TG_OP,
    'associations',
    COALESCE(NEW.id, OLD.id)::text,
    CASE WHEN TG_OP = 'INSERT' THEN NULL ELSE public.strip_secrets(to_jsonb(OLD)) END,
    CASE WHEN TG_OP = 'DELETE' THEN NULL ELSE public.strip_secrets(to_jsonb(NEW)) END,
    COALESCE(NEW.id, OLD.id)
  );
  RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_audit_associations ON public.associations;
CREATE TRIGGER trg_audit_associations
AFTER INSERT OR UPDATE OR DELETE ON public.associations
FOR EACH ROW EXECUTE FUNCTION public.audit_associations_changes();