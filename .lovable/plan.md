
# Lot 1.3 — Découplage envoi identifiants + reset MDP

## État actuel (déjà en place)

- `create-user-account` **n'envoie plus** d'email (retiré depuis Lot 1.1). ✅
- Bouton "Envoyer identifiants" existe déjà dans `CreateUserDialog` (post-création) et `UtilisateursAdmin` ("Renvoyer les identifiants" dans le menu ligne). ✅
- Edge function `send-user-credentials` accepte `resetPassword: true|false`. ✅

## Manques à corriger

Le comportement fonctionne mais l'UX et le code sont dupliqués/faibles :

1. Le "Renvoyer identifiants" du tableau **réinitialise le mot de passe sans confirmation** (`resetPassword: true` + pas de dialog) → risque élevé de casser un compte par accident. Violation memory core (`AlertDialog` obligatoire, pas de confirm implicite).
2. Chaque appelant redéfinit son propre dictionnaire `codes` FR — Lot 1.1 a introduit `toToastError` / `translateErrorCode` dans `src/lib/errors.ts` qui n'est pas utilisé.
3. Pas de distinction UI claire entre "**Renvoyer**" (même mot de passe, si connu) et "**Réinitialiser + envoyer**" (nouveau mot de passe forcé). Un seul bouton fait les deux → confusion.
4. Pas de désactivation multi-clic globale : deux boutons différents pour deux utilisateurs → possible double reset simultané.

## Livrables

### 1. `src/hooks/useSendUserCredentials.ts` (nouveau)

Hook centralisé, utilisé par `CreateUserDialog` et `UtilisateursAdmin`.

```
useSendUserCredentials() → {
  sendExisting(userId, options?)  // resetPassword: false, password optionnel
  resetAndSend(userId)             // resetPassword: true
  isPending(userId?): boolean
}
```

- Appelle `send-user-credentials` via `supabase.functions.invoke`.
- Utilise `extractEdgeError` + `translateErrorCode` (déjà présents).
- Toast succès : `Nouveaux identifiants envoyés à <email>` / `Identifiants envoyés à <email>`.
- Toast erreur : `toToastError()` (titre FR mappé + description serveur).
- Invalide `["utilisateurs"]` en cas de reset (pour rafraîchir `password_changed`).

### 2. `UtilisateursAdmin.tsx`

- Deux entrées distinctes dans le menu ligne :
  - **"Renvoyer identifiants"** (Mail) → uniquement disponible si `password_changed === false` (le mot de passe temporaire est encore valide côté back). Envoie via `sendExisting` (reset côté back seulement si nécessaire).
  - **"Réinitialiser mot de passe"** (KeyRound) → confirme via `AlertDialog` (`"Cette action génère un nouveau mot de passe temporaire et l'envoie par email. L'utilisateur devra le changer à sa prochaine connexion."`), puis `resetAndSend`.
- Suppression du dictionnaire local `codes` (remplacé par `toToastError`).
- Retire l'action existante `Renvoyer les identifiants` (unifiée).

### 3. `CreateUserDialog.tsx`

- Utilise `useSendUserCredentials().sendExisting(created.userId, { password: created.password })`.
- Retire l'objet local `ERROR_MESSAGES` (remplacé par le mapping central).
- Bouton "Envoyer les identifiants par email" garde son loader existant.

### 4. Petit nettoyage `src/lib/errors.ts`

- Rien à changer côté logique. Vérifier que le mapping `translateErrorCode` couvre bien `EMAIL_SEND_FAILED`, `USER_NOT_FOUND`, `FORBIDDEN`, `EMAIL_ALREADY_EXISTS` (déjà fait Lot 1.1). ✅

## Fichiers touchés

| Fichier | Action |
|---|---|
| `src/hooks/useSendUserCredentials.ts` | **création** |
| `src/pages/admin/UtilisateursAdmin.tsx` | remplace `handleResendCredentials`, ajoute `AlertDialog` de reset, deux entrées menu |
| `src/components/admin/CreateUserDialog.tsx` | remplace `handleSendCredentials`, retire `ERROR_MESSAGES` local |

## Hors périmètre

- Refactor de `UserMemberLinkManager.tsx` (n'appelle pas `send-user-credentials`, seulement `create-user-account`) → intact.
- Migration des 22 autres edge functions vers `_shared/errors.ts` → plus tard.
- Décision Resend/SMTP → Lot 1.5.

## Validation

- Build TypeScript propre.
- Test manuel :
  - Créer un compte → bouton "Envoyer identifiants" fonctionne (comportement inchangé, mais code centralisé).
  - Depuis le tableau : "Renvoyer identifiants" grisé si `password_changed = true`. "Réinitialiser mot de passe" ouvre AlertDialog, puis reset + envoi.

## Rollback

Restauration git des 2 fichiers UI + suppression du hook. La edge function n'est pas touchée.
