
-- Enrichissement de la table associations
ALTER TABLE public.associations
  ADD COLUMN IF NOT EXISTS slug text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS theme_tokens jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS email_config  jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS caisse_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS locale text NOT NULL DEFAULT 'fr',
  ADD COLUMN IF NOT EXISTS feature_flags jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS statut text NOT NULL DEFAULT 'actif',
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- Backfill du slug E2D (une seule ligne existante)
UPDATE public.associations SET slug = 'e2d' WHERE slug IS NULL;

-- Contraintes slug
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='associations_slug_key') THEN
    ALTER TABLE public.associations ADD CONSTRAINT associations_slug_key UNIQUE (slug);
  END IF;
END $$;
ALTER TABLE public.associations ALTER COLUMN slug SET NOT NULL;

-- Trigger updated_at
DROP TRIGGER IF EXISTS trg_associations_updated_at ON public.associations;
CREATE TRIGGER trg_associations_updated_at
  BEFORE UPDATE ON public.associations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Création de l'association Phoenix (2ème tenant)
INSERT INTO public.associations (nom, slug, description, statut)
SELECT 'Phoenix', 'phoenix', 'Section sportive Phoenix', 'actif'
WHERE NOT EXISTS (SELECT 1 FROM public.associations WHERE slug='phoenix');
