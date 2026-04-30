
# Stabilisation du module Utilisateurs / Authentification

## Diagnostic actuel

- **Deux Edge Functions concurrentes** font le même travail (`create-user-account`, `create-platform-user`) avec des contrats différents → confusion et bugs.
- **Pas de rollback** : si le lien `membres.user_id` ou l'attribution de rôle échoue, l'utilisateur auth est créé orphelin.
- **Erreurs non standardisées** : tantôt `error: "..."`, tantôt message brut Supabase remonté à l'UI ("non-2xx").
- **Email couplé à la création** : un échec SMTP/Resend peut être perçu comme un échec global (les logs montrent déjà `Authentification échouée` sur Outlook SMTP).
- **UX** : un seul bouton "Créer le compte" qui fait tout en bloc, pas d'option de renvoi des identifiants après coup.

## Ce qui sera implémenté

### 1. Edge Function unique et atomique : `create-user-account` (refonte)

Supprime `create-platform-user` (doublon). Nouveau contrat strict :

**Input**
```
{ email, nom, prenom, telephone?, password?, roleIds: string[], membreId?: string|null }
```

**Flow backend** (try/catch global, transactionnel via rollback manuel) :
1. Auth caller + check `is_admin()` via RPC
2. Validation (zod-style) : email RFC, password ≥ 8 + complexité, nom/prenom non vides
3. **Pré-check email** : `auth.admin.listUsers` filtré → si existe → `EMAIL_EXISTS`
4. **Pré-check membre** : si `membreId`, vérifier qu'il n'a pas déjà un `user_id`
5. `auth.admin.createUser({ email_confirm: true })` → récupère `userId`
6. Update `profiles` (must_change_password=true)
7. Insert `user_roles` (rôle "membre" par défaut si liste vide)
8. Si `membreId` : update `membres.user_id` + insert `membres_roles`
9. **Rollback en cascade** : à chaque échec après l'étape 5 → `auth.admin.deleteUser(userId)` + cleanup tables → renvoie `SERVER_ERROR`
10. Retour : `{ success: true, userId }`

**Format de réponse unifié (toutes les routes)**
```
Succès : { success: true, data?: {...} }                  HTTP 200
Erreur : { success: false, code: "EMAIL_EXISTS|INVALID_DATA|SERVER_ERROR|EMAIL_SEND_FAILED|FORBIDDEN", message: "..." }
HTTP   : 200 / 400 (validation, email_exists) / 403 / 500
```

### 2. Nouvelle Edge Function : `send-user-credentials`

Découplée de la création. Appelable indépendamment ("Renvoyer les identifiants").

**Input** : `{ userId, password? }` (si password absent → génère un nouveau mot de passe temporaire et le réinitialise via `auth.admin.updateUserById`).

**Flow** :
1. Check admin caller
2. Lookup email/nom/prenom depuis `profiles`
3. Envoi via **Resend API** (`RESEND_API_KEY` déjà configuré) avec template HTML branded E2D
4. Log `console.log/error` détaillé (id, status Resend, message)
5. Retour `{ success, code: "EMAIL_SEND_FAILED"? }`

Resend remplace l'envoi SMTP Outlook (qui échoue côté logs : *basic authentication is disabled*). Les autres flux email continuent d'utiliser `send-email` actuel.

### 3. Migration DB : intégrité auth ↔ membres

```sql
-- Empêcher doublon membre↔user
CREATE UNIQUE INDEX IF NOT EXISTS idx_membres_user_id_unique 
  ON public.membres(user_id) WHERE user_id IS NOT NULL;

-- RPC de réconciliation : log les désync, retourne la liste
CREATE OR REPLACE FUNCTION public.audit_auth_membres_sync()
RETURNS TABLE(type text, id uuid, detail text)
LANGUAGE sql SECURITY DEFINER SET search_path=public AS $$
  SELECT 'orphan_user'::text, u.id, u.email::text
    FROM auth.users u
    LEFT JOIN public.profiles p ON p.id=u.id
    LEFT JOIN public.membres m ON m.user_id=u.id
    WHERE m.id IS NULL
  UNION ALL
  SELECT 'orphan_membre', m.id, (m.prenom||' '||m.nom)
    FROM public.membres m
    LEFT JOIN auth.users u ON u.id=m.user_id
    WHERE m.user_id IS NOT NULL AND u.id IS NULL;
$$;
```

### 4. Refonte UI `CreateUserDialog.tsx`

- Bouton principal : **"Créer le compte"** (au lieu de "Créer et envoyer")
- Checkbox `sendEmail` retirée du formulaire de création
- Après succès, affichage d'une carte récap avec :
  - email + mot de passe temporaire (copiable)
  - bouton secondaire **"Envoyer les identifiants par email"** → appel `send-user-credentials`
- Loader sur les 2 boutons + `disabled` pendant traitement (anti-double-clic via `isLoading` + `aria-busy`)
- Mapping codes erreur → toast lisible :
  - `EMAIL_EXISTS` → "Cet email est déjà utilisé"
  - `INVALID_DATA` → "Données invalides : <champ>"
  - `EMAIL_SEND_FAILED` → "Compte créé, mais l'email n'a pas pu être envoyé"
  - `SERVER_ERROR` → "Erreur serveur, veuillez réessayer"
- Validation client miroir (email RFC, password ≥ 8) avant submit

### 5. Page Utilisateurs admin

Ajout d'une action ligne **"Renvoyer les identifiants"** par utilisateur (utilise `send-user-credentials`, génère nouveau password temporaire).

### 6. Tests manuels couverts

| Cas | Résultat attendu |
|---|---|
| Création normale | 200 + toast succès + ligne dans table |
| Email déjà existant | Toast "Cet email est déjà utilisé" |
| Données invalides | Toast champ + pas d'appel backend |
| Double clic | Bouton désactivé, 1 seul appel |
| Email Resend KO | Compte créé OK, toast warning email |
| Erreur DB pendant link | Rollback complet, aucun user orphelin |
| Caller non-admin | 403 + toast "Accès réservé" |

## Détails techniques

**Fichiers modifiés / créés**
- ✏️ `supabase/functions/create-user-account/index.ts` — refonte complète (rollback, codes erreur)
- 🗑️ `supabase/functions/create-platform-user/index.ts` — supprimé (doublon)
- ➕ `supabase/functions/send-user-credentials/index.ts` — nouveau, Resend
- ➕ `supabase/migrations/<ts>_user_auth_integrity.sql` — index unique + RPC audit
- ✏️ `src/components/admin/CreateUserDialog.tsx` — UX 2 étapes, gestion codes
- ✏️ `src/pages/admin/UtilisateursAdmin.tsx` — action "Renvoyer identifiants"
- ✏️ `supabase/config.toml` — déclaration `send-user-credentials` (`verify_jwt = false`, validation interne)

**Sécurité**
- Service role key **uniquement** côté Edge Function (jamais frontend)
- `is_admin()` vérifié systématiquement avant toute opération sensible
- Validation backend exhaustive (longueur, format, caractères)
- Logs structurés (`console.error` avec contexte) pour debug

**Pas de changement** côté flux d'envoi email général (`send-email` reste pour autres usages), pas de modification du lifecycle de connexion (`useSessionManager`, etc.).

## Hors périmètre (à confirmer si souhaité)

- Migration des autres edge functions vers Resend (actuellement SMTP Outlook KO → impacte cotisations, reunions, etc.). Peut être traité dans un lot séparé.
- Refonte de la page `Auth.tsx` (login).

Confirme avec **"go"** pour exécuter.
