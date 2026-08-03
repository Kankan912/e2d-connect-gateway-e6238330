-- 1. Colonnes de suivi du cycle de vie
ALTER TABLE public.associations
  ADD COLUMN IF NOT EXISTS statut_change_le timestamptz,
  ADD COLUMN IF NOT EXISTS statut_change_par uuid,
  ADD COLUMN IF NOT EXISTS motif_statut text,
  ADD COLUMN IF NOT EXISTS supprime_le timestamptz;

-- 2. Normalisation + contrainte de valeurs
UPDATE public.associations SET statut = 'actif' WHERE statut NOT IN ('actif','desactive','suspendu','archive','supprime');

ALTER TABLE public.associations DROP CONSTRAINT IF EXISTS associations_statut_check;
ALTER TABLE public.associations
  ADD CONSTRAINT associations_statut_check
  CHECK (statut IN ('actif','desactive','suspendu','archive','supprime'));

-- 3. Helper : association active ?
CREATE OR REPLACE FUNCTION public.is_association_active(_association_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.associations a
    WHERE a.id = _association_id AND a.statut = 'actif'
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_association_active(uuid) TO anon, authenticated, service_role;

-- 4. current_association_id() ne renvoie plus une association non active
CREATE OR REPLACE FUNCTION public.current_association_id()
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT a.id
  FROM public.associations a
  WHERE a.id = COALESCE(
      (SELECT m.association_id FROM public.membres m WHERE m.user_id = auth.uid() LIMIT 1),
      public.default_association_id()
    )
    AND (a.statut = 'actif' OR public.is_super_admin(auth.uid()))
  LIMIT 1;
$$;

-- 5. Site public : renvoie le statut, et le contenu complet uniquement si actif
CREATE OR REPLACE FUNCTION public.get_public_association(_slug text)
RETURNS jsonb
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT jsonb_build_object(
    'id', CASE WHEN a.statut = 'actif' THEN a.id::text ELSE NULL END,
    'slug', a.slug,
    'nom', a.nom,
    'sigle', a.sigle,
    'statut', a.statut,
    'description', CASE WHEN a.statut = 'actif' THEN a.description ELSE NULL END,
    'logo_url', a.logo_url,
    'theme_tokens', a.theme_tokens,
    'locale', a.locale,
    'langue_principale', a.langue_principale,
    'site_template', a.site_template,
    'subdomain', a.subdomain,
    'email_contact', a.email_contact,
    'telephone', a.telephone,
    'adresse', CASE WHEN a.statut = 'actif' THEN a.adresse ELSE NULL END,
    'ville', CASE WHEN a.statut = 'actif' THEN a.ville ELSE NULL END,
    'pays', CASE WHEN a.statut = 'actif' THEN a.pays ELSE NULL END
  )
  FROM public.associations a
  WHERE a.statut <> 'supprime'
    AND (lower(a.slug) = lower(_slug) OR lower(a.subdomain) = lower(_slug))
  LIMIT 1;
$$;

-- 6. Changement de statut (super admin uniquement) + audit
CREATE OR REPLACE FUNCTION public.set_association_statut(_association_id uuid, _statut text, _motif text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_old text;
  v_nom text;
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Action réservée au super administrateur de la plateforme';
  END IF;

  IF _statut NOT IN ('actif','desactive','suspendu','archive','supprime') THEN
    RAISE EXCEPTION 'Statut invalide: %', _statut;
  END IF;

  SELECT statut, nom INTO v_old, v_nom FROM public.associations WHERE id = _association_id;
  IF v_old IS NULL THEN
    RAISE EXCEPTION 'Association introuvable';
  END IF;

  UPDATE public.associations
  SET statut = _statut,
      motif_statut = _motif,
      statut_change_le = now(),
      statut_change_par = auth.uid(),
      supprime_le = CASE WHEN _statut = 'supprime' THEN now() ELSE NULL END,
      updated_at = now()
  WHERE id = _association_id;

  PERFORM public.log_audit(
    'association_statut_change',
    'associations',
    _association_id,
    jsonb_build_object(
      'association', v_nom,
      'ancien_statut', v_old,
      'nouveau_statut', _statut,
      'motif', _motif,
      'resultat', 'succes'
    )
  );

  RETURN jsonb_build_object('success', true, 'ancien_statut', v_old, 'nouveau_statut', _statut);
END;
$$;

REVOKE ALL ON FUNCTION public.set_association_statut(uuid, text, text) FROM public;
GRANT EXECUTE ON FUNCTION public.set_association_statut(uuid, text, text) TO authenticated, service_role;

-- 7. Décompte des dépendances
CREATE OR REPLACE FUNCTION public.count_association_dependencies(_association_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_result jsonb := '{}'::jsonb;
  v_tbl text;
  v_count bigint;
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Action réservée au super administrateur de la plateforme';
  END IF;

  FOREACH v_tbl IN ARRAY ARRAY[
    'membres','profiles','cotisations','reunions','prets','sanctions',
    'fond_caisse_operations','aides','donations','site_events','site_gallery',
    'notifications_historique','audit_logs'
  ] LOOP
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema='public' AND table_name=v_tbl AND column_name='association_id'
    ) THEN
      EXECUTE format('SELECT count(*) FROM public.%I WHERE association_id = $1', v_tbl)
        INTO v_count USING _association_id;
      IF v_count > 0 THEN
        v_result := v_result || jsonb_build_object(v_tbl, v_count);
      END IF;
    END IF;
  END LOOP;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.count_association_dependencies(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.count_association_dependencies(uuid) TO authenticated, service_role;

-- 8. Suppression définitive (bloquée si dépendances)
CREATE OR REPLACE FUNCTION public.hard_delete_association(_association_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_deps jsonb;
  v_nom text;
BEGIN
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Action réservée au super administrateur de la plateforme';
  END IF;

  SELECT nom INTO v_nom FROM public.associations WHERE id = _association_id;
  IF v_nom IS NULL THEN
    RAISE EXCEPTION 'Association introuvable';
  END IF;

  IF _association_id = public.default_association_id() THEN
    RAISE EXCEPTION 'L''association principale de la plateforme ne peut pas être supprimée';
  END IF;

  v_deps := public.count_association_dependencies(_association_id);
  v_deps := v_deps - 'audit_logs';

  IF v_deps <> '{}'::jsonb THEN
    PERFORM public.log_audit('association_hard_delete_refuse','associations',_association_id,
      jsonb_build_object('association', v_nom, 'dependances', v_deps, 'resultat','refuse'));
    RETURN jsonb_build_object('success', false, 'dependances', v_deps);
  END IF;

  PERFORM public.log_audit('association_hard_delete','associations',_association_id,
    jsonb_build_object('association', v_nom, 'resultat','succes'));

  DELETE FROM public.associations WHERE id = _association_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

REVOKE ALL ON FUNCTION public.hard_delete_association(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.hard_delete_association(uuid) TO authenticated, service_role;