
# Lot 1.2 — Refactor `create-user-account` en transaction atomique

Objectif : garantir qu'un utilisateur créé est **complet** (profil + rôles + lien membre) ou **inexistant**. Aujourd'hui la fonction chaîne 4 requêtes SDK avec un rollback JS best-effort — si le process meurt entre deux étapes, on laisse des données orphelines. On centralise tout le côté DB dans une **RPC PostgreSQL transactionnelle**.

## Diagnostic

Après Lot 1.1, la fonction fait :
1. `auth.admin.createUser` (hors transaction possible)
2. `UPDATE profiles` (créée par trigger `handle_new_user`)
3. `INSERT user_roles`
4. `UPDATE membres.user_id`
5. `INSERT membres_roles`

Un `throw` réseau entre 3 et 4 laisse un utilisateur avec rôles mais sans membre lié → état incohérent. Le rollback JS actuel n'est exécuté que si `await` renvoie une erreur, pas si le worker Deno crashe.

## Livrables

### 1. Migration — RPC `provision_user_account`

Nouvelle fonction Postgres `SECURITY DEFINER` :

```
provision_user_account(
  p_user_id      uuid,
  p_email        text,
  p_nom          text,
  p_prenom       text,
  p_telephone    text,
  p_role_ids     uuid[],
  p_membre_id    uuid
) RETURNS jsonb
```

Comportement dans **une seule transaction** :
- `UPDATE profiles` (nom, prenom, email, telephone, must_change_password=true).
- Si `p_role_ids` vide → sélectionner le rôle par défaut `membre` ; sinon utiliser la liste.
- `INSERT INTO user_roles` (idempotent via `ON CONFLICT DO NOTHING`).
- Si `p_membre_id` : vérifier `user_id IS NULL` (sinon `RAISE EXCEPTION 'membre_already_linked'`), puis `UPDATE membres SET user_id = p_user_id` + `INSERT INTO membres_roles`.
- Renvoie `{ user_id, role_ids, membre_id }`.
- Toute exception → rollback automatique Postgres.

Sécurité :
- `EXECUTE` **réservé à `service_role`** uniquement (pas à `authenticated`, pas à `anon`).
- `SET search_path = public`.
- Utilise `has_role`/checks internes pour ne pas dépendre du caller.

Ajout dans `audit_logs` : entrée `{ action: 'user_provisioned', resource: 'profiles', resource_id: p_user_id, metadata }` insérée par la RPC.

### 2. Refonte edge function `create-user-account`

Pipeline simplifié :

```
1. Auth + admin check                   (Lot 1.1)
2. Validation input (zod)               ← NEW
3. Pré-check email libre (profiles)     (Lot 1.1)
4. Pré-check membre libre               (Lot 1.1)
5. auth.admin.createUser
6. supaAdmin.rpc('provision_user_account', {...})
   ├─ succès  → successResponse({ userId, email, tempPassword })
   └─ échec   → auth.admin.deleteUser(userId) + throw AppError adapté
                (mapping 'membre_already_linked' → ConflictError FR)
```

Le rollback JS multi-étapes disparaît (remplacé par la transaction Postgres).

### 3. Validation zod

Nouveau schéma dans le fichier edge :

```
BodySchema = z.object({
  email: z.string().trim().toLowerCase().email().max(255),
  nom: z.string().trim().min(1).max(100),
  prenom: z.string().trim().min(1).max(100),
  telephone: z.string().trim().max(30).nullable().optional(),
  password: z.string().min(8).max(128).optional(),
  roleIds: z.array(z.string().uuid()).max(20).optional(),
  membreId: z.string().uuid().nullable().optional(),
});
```

`safeParse` → `ValidationError` avec `details = flatten().fieldErrors`.

### 4. Tests Deno

Fichier `supabase/functions/create-user-account/index.test.ts` :

- `dotenv/load` pour charger `.env`.
- Tests **sans authentification** (contre la fonction déployée via `fetch`) :
  - `POST` sans `Authorization` → 401 code `UNAUTHORIZED`.
  - `POST` avec token anon → 401 ou 403.
  - `POST` avec body vide → 400 code `VALIDATION_ERROR`.
  - `POST` avec email invalide → 400 code `VALIDATION_ERROR` + `details.email`.
- Pas de test de succès (nécessiterait un admin de test — reporté en Phase 3 avec le seed `seed-test-users`).
- Toujours consommer `response.text()` pour éviter les fuites Deno.

## Fichiers touchés

| Fichier | Action |
|---|---|
| `supabase/migrations/<nouveau>.sql` | RPC `provision_user_account` + grant `service_role` + audit log |
| `supabase/functions/create-user-account/index.ts` | refonte complète (validation zod + RPC + rollback auth simple) |
| `supabase/functions/create-user-account/index.test.ts` | **création**, tests d'entrée invalides |

## Hors périmètre

- Bouton "Envoyer identifiants" dédié + retrait auto-envoi → **Lot 1.3** (la fonction ne fait déjà pas d'envoi email, mais l'UI a besoin d'un bouton propre séparé).
- Migration des 23 autres edge functions vers le format `errors.ts` → **plus tard**.
- Ajout `association_id` sur `profiles` / `membres` → **Phase 2**.

## Validation avant merge

- Tests Deno verts (`test_edge_functions`).
- Test manuel UI : création d'un membre avec un membre déjà lié → toast FR `Cet email est déjà utilisé` / `Ce membre a déjà un compte`, aucun utilisateur auth créé.
- Test manuel : simuler échec RPC (ex : `roleIds` avec UUID inexistant) → l'utilisateur auth créé est bien supprimé (vérif `auth.users`).

## Rollback

- Suppression de la RPC : `DROP FUNCTION public.provision_user_account`.
- Restauration du edge function via git revert.
- Le format de réponse restant inchangé, les consommateurs UI (`CreateUserDialog`, `UserMemberLinkManager`) ne bougent pas.

---

Prêt à exécuter dès validation.
