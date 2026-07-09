
-- 1. Table platform_settings
CREATE TABLE public.platform_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cle text NOT NULL UNIQUE,
  valeur jsonb,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.platform_settings TO authenticated;
GRANT ALL    ON public.platform_settings TO service_role;
ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "platform_settings_read_authenticated"
  ON public.platform_settings FOR SELECT TO authenticated USING (true);
CREATE TRIGGER trg_platform_settings_updated_at
  BEFORE UPDATE ON public.platform_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 2. Table association_settings
CREATE TABLE public.association_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  association_id uuid NOT NULL REFERENCES public.associations(id) ON DELETE CASCADE,
  cle text NOT NULL,
  valeur jsonb,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (association_id, cle)
);
CREATE INDEX association_settings_association_id_idx ON public.association_settings(association_id);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.association_settings TO authenticated;
GRANT ALL ON public.association_settings TO service_role;
ALTER TABLE public.association_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "association_settings_read_authenticated"
  ON public.association_settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "association_settings_write_authenticated"
  ON public.association_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE TRIGGER trg_association_settings_updated_at
  BEFORE UPDATE ON public.association_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
ALTER TABLE public.association_settings ALTER COLUMN association_id SET DEFAULT public.default_association_id();

-- 3. Backfill avec cast intelligent : essayer valeur::jsonb, sinon la wrapper en jsonb string
INSERT INTO public.association_settings (association_id, cle, valeur, description)
SELECT
  (SELECT id FROM public.associations WHERE slug='e2d'),
  cle,
  CASE
    WHEN valeur IS NULL THEN NULL
    ELSE COALESCE(
      (SELECT to_jsonb(valeur::text)  -- fallback : chaîne
       WHERE valeur !~ '^\s*[\{\[]'    -- pas un objet/tableau JSON
         AND valeur !~ '^\s*(true|false|null|-?\d+(\.\d+)?)\s*$'),
      valeur::jsonb
    )
  END,
  description
FROM public.configurations
ON CONFLICT (association_id, cle) DO NOTHING;

-- 4. Vue de compatibilité
CREATE OR REPLACE VIEW public.configurations_v_compat AS
  SELECT ps.id, ps.cle, ps.valeur, ps.description, NULL::uuid AS association_id,
         ps.created_at, ps.updated_at
    FROM public.platform_settings ps
  UNION ALL
  SELECT s.id, s.cle, s.valeur, s.description, s.association_id,
         s.created_at, s.updated_at
    FROM public.association_settings s;
GRANT SELECT ON public.configurations_v_compat TO authenticated;

-- 5. Renommer l'ancienne table
ALTER TABLE public.configurations RENAME TO configurations_deprecated;
COMMENT ON TABLE public.configurations_deprecated IS
  'Déprécié en Phase 2.2 — voir platform_settings + association_settings. À supprimer après migration complète Phase 4.';
