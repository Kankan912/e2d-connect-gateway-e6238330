# Audit Phase 1 — Lots 1.1 → 1.4

Vérification exhaustive des livrables Phase 1. **Conclusion : conforme, aucun correctif requis.**

## Lot 1.1 — Standardisation erreurs edge functions ✅

| Attendu | Vérifié |
|---|---|
| `supabase/functions/_shared/errors.ts` | Présent — classes `AppError`, `ValidationError`, `Unauthorized`, `Forbidden`, `NotFound`, `Conflict`, `EmailAlreadyExists`, `ExternalService`, `Internal` + `errorResponse()` / `successResponse()` |
| `src/lib/errors.ts` étendu (rétro-compatible) | Présent — `extractEdgeError`, `translateErrorCode` (FR), `toToastError` + `getErrorMessage` conservé |
| 3 edge functions migrées | `create-user-account`, `send-email`, `send-user-credentials` importent bien `../_shared/errors.ts` |
| Zéro consommateur cassé | Format `{ success, code, message, details? }` conservé |

## Lot 1.2 — Refactor `create-user-account` (transactionnel) ✅

- Schéma Zod strict : `email / nom / prenom / telephone / password / roleIds / membreId`
- Pré-check email (`profiles.ilike`) + pré-check `membreId` avant création auth
- Provision atomique via RPC `provision_user_account` (SECURITY DEFINER) + **rollback `auth.admin.deleteUser`** si RPC échoue
- Traduction précise des erreurs (`membre_already_linked`, `membre_not_found`, `email_exists`)
- **Correctif régression appliqué** dans `UserMemberLinkManager.tsx` : payload remappé (`membreId`, `nom`, `prenom`, `telephone`, `password`) — vérifié ligne 186-199, plus aucune trace de `memberId`/`memberNom`/`tempPassword` dans le body d'invoke
- Typecheck `tsgo` propre

## Lot 1.3 — Découplage envoi identifiants ✅

- Hook dédié `src/hooks/useSendUserCredentials.ts` avec deux modes :
  - `sendExisting(userId, { password })` — envoi sans reset
  - `resetAndSend(userId)` — génère un nouveau mot de passe côté serveur puis l'envoie
- `CreateUserDialog.tsx` : flux en 2 étapes (`form` → `created`) avec bouton **"Envoyer les identifiants"** distinct, copie clipboard email/password, aucun auto-envoi lors de la création
- Invalidation cache `utilisateurs` après reset

## Lot 1.4 — Robustesse UI ✅

| Livrable | État |
|---|---|
| `src/components/ui/loading-button.tsx` | Présent (wrapper `Button` + `Loader2`) |
| Migration formulaires critiques | 7 fichiers migrés : `CompteRenduForm`, `CotisationSaisieForm`, `E2DMatchForm`, `E2DMatchEditForm`, `ReunionForm`, `MemberForm`, `CreateUserDialog` |
| `formatFCFA` centralisé (`src/lib/utils.ts`) | Défini + utilisé dans **58 fichiers** (bien au-delà des 7 initiaux) |
| Audit `<a href="/…">` internes | `grep` retourne **0 occurrence** — navigation systématiquement en `Link` / `useNavigate` |
| `ErrorBoundary` routes admin | Couvert par la stratégie 2 niveaux `App` + `Dashboard` (mémoire projet) |

## Cohérence Phase 1

- CHANGELOG documente Lot 1.4 explicitement ; Lots 1.1/1.2/1.3 tracés via l'historique de conversation et les fichiers livrés (edge functions déployées, migration RPC exécutée).
- Aucune dette technique connue sur ce périmètre.
- Lot 1.5 (décision email — domaine custom vs SMTP Gmail + retrait Resend) **reste en attente de décision utilisateur** : c'est le seul élément Phase 1 non exécuté, et c'était explicitement conditionné à ta réponse sur le domaine pro et la clé Resend.

## Recommandation

Phase 1 est **conforme et prête pour Phase 2**. Reste à trancher Lot 1.5 :
1. Domaine pro pour envoi email (ex. `e2d-connect.org`) ou rester sur Gmail ?
2. Résiliation clé Resend morte ou rotation via connector Lovable ?

Aucun code à modifier tant que ces deux décisions ne sont pas prises.
