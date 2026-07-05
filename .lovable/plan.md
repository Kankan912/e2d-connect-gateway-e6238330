## Problème

La table `public.membres` a la RLS activée mais **aucune politique** définie. Résultat : toute opération client (INSERT/UPDATE/DELETE/SELECT) est bloquée → « new row violates row-level security policy for table "membres" » lors de la création d'un membre depuis `/admin/membres`.

Le hook `useMembers` appelle directement `supabase.from("membres").insert(...)` avec la clé anon, ce qui exige des politiques RLS explicites.

## Correctif (migration SQL uniquement)

Ajouter les 4 politiques standard sur `public.membres`, alignées sur le reste du projet :

- **SELECT** : tout utilisateur authentifié (nécessaire pour listes, sélecteurs d'avaliste, jointures, etc.).
- **INSERT** : réservé aux admins via `public.is_admin()`.
- **UPDATE** : admins OU le propriétaire du compte lié (`user_id = auth.uid()`) pour permettre à un membre de mettre à jour ses propres infos si l'app le prévoit — sinon admin only. Par défaut je pars sur **admin only** pour rester strict (la page profil passe par `profiles`, pas `membres`).
- **DELETE** : admins uniquement.

Grants : `membres` est déjà accessible aux rôles `authenticated`/`service_role` (les autres requêtes fonctionnent). Aucun GRANT à ajouter, seulement les policies.

```sql
CREATE POLICY "membres_select_authenticated"
  ON public.membres FOR SELECT TO authenticated USING (true);

CREATE POLICY "membres_insert_admin"
  ON public.membres FOR INSERT TO authenticated WITH CHECK (public.is_admin());

CREATE POLICY "membres_update_admin"
  ON public.membres FOR UPDATE TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "membres_delete_admin"
  ON public.membres FOR DELETE TO authenticated USING (public.is_admin());
```

## Validation

1. Recréer un membre depuis `/dashboard/admin/membres` → toast « Membre créé ».
2. Vérifier que la liste des membres s'affiche toujours (SELECT ok).
3. Vérifier qu'un utilisateur non-admin ne peut ni insérer ni supprimer (toast d'erreur RLS attendu).

## Hors périmètre

Vous avez confirmé « uniquement `membres` ». Les 34 autres tables sans policies (cotisations, prets, epargnes, reunions, fond_caisse_operations, sanctions, notifications_*, etc.) ne sont pas touchées — elles fonctionnent probablement via des RPC `SECURITY DEFINER`. Si un jour l'une d'elles renvoie la même erreur RLS, on ouvrira un correctif ciblé.
