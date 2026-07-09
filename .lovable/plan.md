
# Lot 1.1 — Standardisation des erreurs edge functions

Fondation technique des Lots 1.2 et 1.3. Aucun changement de comportement fonctionnel : on remplace les réponses d'erreur hétérogènes par un format unique `{ code, message, details }`, et on ajoute côté front un extracteur + mapping FR.

## Objectif

- Format de réponse d'erreur **unique** pour toutes les edge functions.
- Codes stables (`EMAIL_ALREADY_EXISTS`, `VALIDATION_ERROR`, `SERVER_ERROR`, …) exploitables par l'UI sans parser des chaînes.
- Traductions FR centralisées côté front, plus jamais de `error.message` technique affiché à l'utilisateur.

## Livrables

### 1. `supabase/functions/_shared/errors.ts` (nouveau)
- Classe de base `AppError extends Error` : `code`, `status`, `details?`.
- Sous-classes prêtes à l'emploi : `ValidationError` (400), `UnauthorizedError` (401), `ForbiddenError` (403), `NotFoundError` (404), `ConflictError` (409, ex : `EmailAlreadyExistsError`), `ExternalServiceError` (502, ex : SMTP), `InternalError` (500).
- Helper `errorResponse(err: unknown, corsHeaders)` qui :
  - convertit un `AppError` en `Response` JSON `{ code, message, details }` avec le bon status ;
  - convertit un `Error` inconnu en `{ code: 'SERVER_ERROR', message: err.message }` status 500 ;
  - log via `console.error` avec le code + stack ;
  - inclut toujours `corsHeaders`.
- Helper `successResponse(data, corsHeaders, status = 200)` pour uniformiser aussi les succès.

### 2. `src/lib/errors.ts` (extension du fichier existant)
- Conserve `getErrorMessage()` (non cassant).
- Ajoute `type AppErrorPayload = { code: string; message: string; details?: unknown }`.
- Ajoute `extractEdgeError(error, data)` qui renvoie `AppErrorPayload` en gérant :
  - `data?.error` (format edge function),
  - `FunctionsHttpError` (lecture du body),
  - `Error` natif → fallback `SERVER_ERROR`.
- Ajoute `translateErrorCode(code): string` avec mapping FR (au moins : `EMAIL_ALREADY_EXISTS`, `VALIDATION_ERROR`, `UNAUTHORIZED`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `EXTERNAL_SERVICE_ERROR`, `SERVER_ERROR`, fallback = message brut).
- Ajoute `toastEdgeError(error, data, toast)` = helper utilisé par les composants (`toast({ variant: 'destructive', title, description })`).

### 3. Migration de 3 edge functions critiques
- `supabase/functions/create-user-account/index.ts` : remplacer les `return new Response(JSON.stringify({ error: ... }))` par `throw new AppError(...)` + `catch → errorResponse()`. Aucun changement de logique métier dans ce lot (le vrai refacto vient au Lot 1.2).
- `supabase/functions/send-email/index.ts` : idem, erreurs SMTP/Resend → `ExternalServiceError`.
- `supabase/functions/send-user-credentials/index.ts` : idem.

### 4. Zéro consommateur cassé
- Les autres 23 edge functions ne sont **pas** touchées dans ce lot (elles restent fonctionnelles avec l'ancien format ; `extractEdgeError` gère les deux formats). Migration progressive dans les lots suivants.

## Fichiers touchés

| Fichier | Action |
|---|---|
| `supabase/functions/_shared/errors.ts` | **création** |
| `src/lib/errors.ts` | extension (non cassant) |
| `supabase/functions/create-user-account/index.ts` | remplacement des retours d'erreur |
| `supabase/functions/send-email/index.ts` | idem |
| `supabase/functions/send-user-credentials/index.ts` | idem |
| composants appelant ces 3 fonctions | remplacer `error.message` par `toastEdgeError(...)` (audit rapide, ~5-8 appels) |

## Hors périmètre (traité plus tard)

- Refactor logique de `create-user-account` (transaction atomique) → **Lot 1.2**.
- Découplage envoi identifiants + bouton dédié → **Lot 1.3**.
- Audit `<a href>` internes + `LoadingButton` + `formatFCFA` → **Lot 1.4**.
- Décision Resend/SMTP + domaine pro → **Lot 1.5** (dépend de tes réponses aux 2 questions ouvertes).

## Validation avant merge

- Build TypeScript propre (`tsgo`).
- Test manuel des 3 edge functions via l'UI : création utilisateur avec email existant → toast FR clair `"Cet email est déjà utilisé"` au lieu du message brut Supabase.
- Aucun consommateur non migré ne casse (grâce à `extractEdgeError` compatible ancien format).

## Rollback

Suppression du fichier `_shared/errors.ts` + git revert des 3 edge functions. Le fichier `src/lib/errors.ts` reste rétro-compatible (`getErrorMessage` inchangé).

---

Prêt à exécuter dès validation. Les questions ouvertes (domaine pro + Resend) ne bloquent que le Lot 1.5.
