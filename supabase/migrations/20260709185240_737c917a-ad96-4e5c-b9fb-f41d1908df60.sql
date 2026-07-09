
-- Index sur audit_logs.association_id (déjà nullable et présent)
CREATE INDEX IF NOT EXISTS audit_logs_association_id_idx ON public.audit_logs(association_id);

DO $$
DECLARE
  v_e2d uuid; t text;
  nullable_tables text[] := ARRAY[
    'email_logs','notifications_campagnes','notifications_config',
    'notifications_envois','notifications_historique','notifications_logs',
    'notifications_templates'
  ];
BEGIN
  SELECT id INTO v_e2d FROM public.associations WHERE slug='e2d';
  FOREACH t IN ARRAY nullable_tables LOOP
    EXECUTE format('ALTER TABLE public.%I ADD COLUMN IF NOT EXISTS association_id uuid REFERENCES public.associations(id)', t);
    EXECUTE format('UPDATE public.%I SET association_id=%L WHERE association_id IS NULL', t, v_e2d);
    EXECUTE format('CREATE INDEX IF NOT EXISTS %I ON public.%I(association_id)', t||'_association_id_idx', t);
  END LOOP;
END $$;
