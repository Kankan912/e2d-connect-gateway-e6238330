# Diagnostic

J'ai trouvé la **cause racine** des trois symptômes (loader infini, modules invisibles, déconnexion qui semble échouer) et elle est unique : **toutes les tables du schéma `public` sont sans `GRANT` pour les rôles `anon` / `authenticated` / `service_role`**.

Preuve :
- `SELECT … FROM information_schema.role_table_grants WHERE table_schema='public' AND grantee IN ('anon','authenticated','service_role')` → **0 ligne** (117 tables existent dans `public`).
- L'`USAGE` sur le schéma est OK, mais sans `GRANT` table par table, PostgREST renvoie systématiquement « permission denied » ou laisse la requête pendre.
- Console : `[AuthContext] fetchUserProfile safety timeout (8s)` se répète → le `Promise.all` sur `profiles` / `user_roles` / `role_permissions` ne se résout jamais.
- Le compte admin (`ci-administrateur@e2d-test.local`) a bien le rôle `administrateur` avec **78 permissions**. Le sidebar est vide uniquement parce que `usePermissions` ne reçoit aucune ligne → tout est filtré.
- La déconnexion : `signOut()` part bien, mais comme `fetchUserProfile` est en boucle (relogin/refresh), la session se ré-établit immédiatement et l'utilisateur a l'impression que rien ne se passe.

Le warning CSP « eval » de l'image vient d'une lib tierce dans la preview Lovable (recharts/jspdf). Ce n'est pas la cause des bugs et ce sera traité séparément si besoin.

# Plan

## 1. Migration SQL — restaurer les GRANTs Data API

Une seule migration qui, pour chaque table `BASE TABLE` du schéma `public` :
- Accorde `SELECT, INSERT, UPDATE, DELETE` à `authenticated`.
- Accorde `ALL` à `service_role`.
- N'accorde **rien** à `anon` (les politiques RLS du projet sont quasi toutes scopées à `auth.uid()` / `is_admin()`). Les rares tables publiques (`site_*`, `events_public`, etc.) seront ouvertes à `anon` au cas par cas dans un second bloc explicite si on les identifie après vérification.

Forme :

```sql
DO $$
DECLARE t record;
BEGIN
  FOR t IN SELECT tablename FROM pg_tables WHERE schemaname='public'
  LOOP
    EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t.tablename);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t.tablename);
  END LOOP;
END$$;

-- Ouvertures anon ciblées (lecture publique du site vitrine)
GRANT SELECT ON public.site_hero, public.site_about, public.site_activities,
                public.site_events, public.site_gallery, public.site_partners,
                public.site_config, public.site_images TO anon;
-- (la liste exacte sera validée à l'exécution selon les tables réellement présentes)
```

Aucun changement RLS : les policies existantes sécurisent déjà l'accès ligne par ligne. On rétablit seulement le canal Data API.

## 2. Validation après migration

1. Recharger `/dashboard` connecté comme `administrateur`.
2. Console : plus de `fetchUserProfile safety timeout`. On doit revoir :
   - `[AuthContext] Profile loaded: …`
   - `[AuthContext] Role data received: administrateur`
   - `[AuthContext] Permissions loaded: 78`
3. Sidebar : sections **E2D / Administration / Sport / Communication / Site Web** visibles.
4. Bouton **Déconnexion** (header avatar) → retour sur `/` + toast « Déconnexion réussie ».
5. Vérifier que le site vitrine public (`/`, `/sport`, etc.) charge toujours ses contenus (sinon ajouter le `GRANT SELECT … TO anon` manquant).

## 3. Hors périmètre (à traiter ensuite si besoin)

- Warning CSP `eval` (lib tierce, non bloquant).
- Audit complet de chaque bouton du dashboard (à faire une fois la nav rétablie, sinon on chasse des bugs fantômes causés par le manque de GRANT).

# Détails techniques

- Fichier créé : `supabase/migrations/<timestamp>_restore_public_grants.sql`.
- Aucun changement côté React. Le code `AuthContext` / `usePermissions` est correct ; il était juste affamé de données.
- Le `service_role` bypasse déjà RLS, mais on ajoute `GRANT ALL` par cohérence (requis par les Edge Functions qui utilisent la clé service).
