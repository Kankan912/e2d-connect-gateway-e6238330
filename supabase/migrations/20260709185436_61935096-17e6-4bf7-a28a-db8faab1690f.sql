
ALTER TABLE public.configurations_deprecated RENAME TO configurations;
COMMENT ON TABLE public.configurations IS
  'À déprécier en Phase 4 au profit de platform_settings / association_settings. Les données sont déjà copiées dans association_settings pour E2D.';
