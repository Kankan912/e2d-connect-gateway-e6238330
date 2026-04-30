
# Code review complet — État du projet et bugs à corriger

## 1. État global

Bonne nouvelle : aucune **erreur runtime** ni **erreur console** n'est actuellement remontée. Les itérations précédentes ont déjà stabilisé les modules critiques (Email, Caisse, Prêts, Cotisations, Utilisateurs, Sport).

Le linter Supabase remonte 96 warnings, mais après analyse :
- **47 warnings** sur `SECURITY DEFINER functions` → nécessaires pour `is_admin()`, `has_role()`, RPC métier (faux positifs).
- **10 warnings** "Public Bucket Allows Listing" → buckets `site-hero`, `site-gallery`, `site-events`, etc. sont publics **par design** (site vitrine).
- **3 warnings** Auth (OTP, leaked password, version Postgres) → à corriger via le **Dashboard Supabase**, pas par code.

## 2. Bugs réels identifiés

### A. Bucket `justificatifs` public (FUITE potentielle)
Le bucket `justificatifs` est marqué public alors qu'il contient des pièces jointes financières (prêts, aides, paiements). **Vraie fuite de confidentialité.**
→ Passer en privé + ajouter policies storage (lecture admin/propriétaire seulement).

### B. Doublon de bucket : `membre-photos` vs `members-photos`
Deux buckets quasi identiques existent → risque de désynchro (uploads dans l'un, lectures dans l'autre).
→ Identifier lequel est utilisé, marquer l'autre comme deprecated dans la doc.

### C. `console.*` résiduels en production (~80 occurrences)
Le standard mémoire impose `src/lib/logger.ts` et strip en prod. Il reste ~80 `console.error/warn/log` non passés par le logger.
→ Migration ciblée des `console.*` les plus visibles vers `logger.*` (hooks `useCaisse`, `useCotisations`, `useEpargnantsBenefices`, `useMatchMedias`, `useLoanRequests`, `storage-utils`).

### D. Auth Supabase : config sécurité
- OTP expiry trop long
- Leaked password protection désactivée
- Postgres avec patches de sécurité disponibles
→ **Action utilisateur** dans le Dashboard Supabase (je ne peux pas le faire en code, mais je documente la marche à suivre).

### E. Vérification de cohérence email_service
Confirmer qu'aucun code legacy ne lit encore `email_mode` (déjà supprimé en DB) côté front.

### F. Function `update-email-config` redondante
Une edge function `update-email-config` existe en parallèle de `EmailConfigManager` qui écrit directement dans `configurations` via RLS. Vérifier si elle est encore appelée, sinon la supprimer pour éviter divergence.

## 3. Plan de correction

### Étape 1 — Sécurité storage
- **Migration SQL** :
  - Passer le bucket `justificatifs` en privé.
  - Créer des policies storage : SELECT/INSERT réservés au propriétaire ou admin (`is_admin()`).
- Vérifier que le code appelant utilise des URLs signées (sinon adapter `storage-utils.ts`).

### Étape 2 — Nettoyage buckets dupliqués
- Audit `rg "membre-photos|members-photos"` → standardiser sur un seul bucket.
- Documenter dans `docs/DATABASE_SCHEMA.md`.

### Étape 3 — Migration logger
- Remplacer les `console.error/warn/log` dans :
  - `src/hooks/useCaisse.ts`
  - `src/hooks/useCotisations.ts`
  - `src/hooks/useEpargnantsBenefices.ts`
  - `src/hooks/useMatchMedias.ts`
  - `src/hooks/useLoanRequests.ts`
  - `src/lib/storage-utils.ts`
- Pattern : `import { logger } from "@/lib/logger"` puis `logger.error("msg", err, { context })`.

### Étape 4 — Cleanup edge function
- Si `update-email-config` n'est plus invoquée → suppression + retrait `config.toml`.
- Sinon → confirmation qu'elle reste cohérente avec le nouveau pipeline.

### Étape 5 — Documentation actions Dashboard
- Créer une note `docs/SECURITY_DASHBOARD_ACTIONS.md` listant :
  1. Réduire OTP expiry à 600s
  2. Activer Leaked password protection
  3. Lancer l'upgrade Postgres
  4. Vérifier visibilité bucket `justificatifs`

## 4. Hors scope (déjà OK)
- Email refactor (terminé)
- Création utilisateur atomique (terminé)
- Caisse `Math.floor` (terminé)
- Validation reconductions prêts (terminé)
- Régénération projection cotisations (terminé)
- Vérification email duplicate côté UI (terminé)

## 5. Pas de modifications spéculatives
Je **ne touche pas** aux modules sans bug concret signalé (sport, présences, événements, dons, adhésions, mobile money) — leurs derniers correctifs sont validés et aucun symptôme n'est remonté.

---

**Confirme avec `go` pour exécuter ce plan ciblé.**
Si tu as un bug spécifique en tête (capture d'écran, message d'erreur, comportement inattendu), partage-le pour que je le traite en priorité.
