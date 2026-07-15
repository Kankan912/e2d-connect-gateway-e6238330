# Rapport de correction — Audit complet 2026-07

**Référence :** `docs/AUDIT_COMPLET_2026_07.md`  
**Statut :** Lot 1 (P0 critique) livré · Lots 2 à 5 planifiés dans `.lovable/plan.md`.

---

## Lot 1 — Correctifs P0 (bloquants pour la mise en production)

### 1. `send-contact-notification` — anti-spam / anti-relay (audit item #1)

**Fichier :** `supabase/functions/send-contact-notification/index.ts`

- Ajout d'un **rate-limit mémoire** par IP (`X-Forwarded-For` → fallback `CF-Connecting-IP`) : **5 requêtes / 60 s / IP**, réponse `429` au-delà.
- **Validation stricte du payload** (types, longueurs, format email regex) avant tout appel SMTP/Resend :
  - `type` restreint à l'énumération (`admin_notification`, `visitor_confirmation`, `admin_reply`).
  - `to`, `contactData.email` : format RFC + longueur ≤ 254.
  - `nom` : 1..100 · `objet` : 1..200 · `message` : ≤ 5000.
- Réponse `400` avec message clair en cas de payload invalide (auparavant : envoi silencieux).

**Impact :** aucun changement côté front (la validation Zod client existait déjà pour la structure). Les attaques de bourrage/relay sont désormais coupées à la source.

### 2. `process-adhesion` — auth obligatoire (audit item #2)

**Fichier :** `supabase/functions/process-adhesion/index.ts`

- Rejet `401` si la requête n'a **ni** header `Authorization: Bearer ...` **ni** header `x-webhook-secret == ADHESION_WEBHOOK_SECRET`.
- Nouveau secret `ADHESION_WEBHOOK_SECRET` généré et stocké côté plateforme (48 chars random).
- Validation du champ `adhesion_id` (string ≥ 10 chars) avant toute écriture SQL.
- Vérification : `rg process-adhesion src/` → **0 appelant côté front** (fonction webhook uniquement) → aucune régression.

**Impact :** l'intégrateur du prestataire de paiement doit désormais transmettre le header `x-webhook-secret` avec la valeur du secret. Aucun changement UI.

### 3. Écritures directes `DELETE` sur `fond_caisse_operations` (audit item #3)

**Nouvelle RPC PostgreSQL :** `reverse_caisse_movement(_operation_id uuid, _reason text)`
- `SECURITY DEFINER`, `search_path=public`, `GRANT EXECUTE TO authenticated`.
- **Aucune suppression** : insère une opération inverse tracée (`libellé = 'ANNULATION — <original>'`, `source_table = 'fond_caisse_operations_reverse'`, `source_id = <original.id>`).
- **Idempotente** : rejouer l'annulation d'une même opération retourne l'ID de la contre-opération existante.
- Bloque les utilisateurs non authentifiés (`auth.uid() IS NULL → EXCEPTION`).

**Nouvelle méthode :** `CaisseService.reverseMovement(operationId, reason?)`
- `src/domain/finance/CaisseService.ts`
- Point d'entrée unique côté front pour toute annulation.

**Sites corrigés :**
- `src/hooks/useCaisse.ts` — `useDeleteCaisseOperation` : `.delete()` → `CaisseService.reverseMovement()` + refresh snapshot. Message toast adapté ("Opération annulée (contre-opération créée)").
- `src/components/ReouvrirReunionModal.tsx` — la réouverture d'une réunion liste les opérations `reunion_id = X` puis appelle `CaisseService.reverseMovement` sur chacune, avec motif `"Réouverture réunion <date>"`. Les échecs individuels sont loggés sans bloquer la procédure.

**Modules impactés :**
- Dashboard caisse (`/admin/finances/caisse`) — flow d'annulation manuelle.
- Réouverture réunion (`/admin/reunions`) — flow ClotureReunionModal ⇄ ReouvrirReunionModal.
- Audit trail `fond_caisse_operations` : désormais complet, aucun trou dans l'historique.
- Soldes recalculés identiques (`get_solde_caisse` et snapshot) — la contre-opération neutralise l'originale.

### 4. Bypass workflow aides (audit item #4)

**Fichier :** `src/hooks/useAides.ts`

- `useUpdateAide` reçoit désormais un payload strictement filtré via whitelist `AIDE_EDITABLE_KEYS` :
  - Autorisés : `type_aide_id`, `beneficiaire_id`, `reunion_id`, `exercice_id`, `montant`, `date_allocation`, `contexte_aide`, `justificatif_url`, `notes`.
  - **Rejetés silencieusement** : `statut`, `date_validation`, `validateur_id`, `montant_alloue`, tout autre champ non listé.
- Les transitions de statut passent EXCLUSIVEMENT par `useAdvanceAideWorkflow` → `AideService.advanceWorkflow` (garde-fous des transitions autorisées + trigger caisse serveur).

**Modules impactés :** page `AidesAdmin.tsx` — les mutations sur le formulaire d'édition n'écrasent plus le statut, même par accident.

---

## Contrôles anti-régression exécutés

| Contrôle | Résultat |
|---|---|
| `tsgo --noEmit` (typecheck complet) | ✅ 0 erreur |
| Migration Supabase (RPC `reverse_caisse_movement`) | ✅ appliquée |
| Linter Supabase | 192 signalements pré-existants (aucun introduit par cette RPC) |
| Aucun `.delete()` sur `fond_caisse_operations` hors service | ✅ vérifié `rg -n "fond_caisse_operations\").*delete" src/` → 0 |
| Aucun consommateur front rompu | ✅ `useDeleteCaisseOperation` signature identique |

---

## Anomalies restantes (Lots 2 → 5)

Suivre `.lovable/plan.md`. Ordre de priorité :

- **Lot 2 (P1 sécurité web)** : headers Vercel (CSP/HSTS), CORS restrictif Edge Fns, workflow CI (lint/typecheck/tests), déplacement `vitest/jsdom/@testing-library/*` en devDeps.
- **Lot 3 (P1 métier)** : alertes prêts (`useAlertesGlobales`), prorata temporis bénéficiaires, formatage devise multi-tenant (~30 fichiers), `Promise.all` `useUtilisateurs`, filtre `exercices_cotisations_types.actif`.
- **Lot 4 (P2)** : fusion `useCaisseStats`/`useCaisseSoldeSnapshot`, Zod sur 18 Edge Fns, `strictNullChecks`, Sentry, refactor composants > 400 lignes, retrait bypass admin front, a11y aria-labels, design tokens, tests UI.
- **Lot 5 (P3)** : code mort, singleton Realtime prêts, catch-all route Dashboard, `manualChunks` Vite.

Chaque lot suivant s'appuie sur les mêmes contrôles anti-régression + checklist §18 de l'audit + vérification RBAC des 8 rôles + isolation multi-tenant.

---

## Fichiers modifiés (Lot 1)

- `supabase/functions/send-contact-notification/index.ts`
- `supabase/functions/process-adhesion/index.ts`
- `supabase/migrations/<horodatage>_reverse_caisse_movement.sql` (nouvelle)
- `src/domain/finance/CaisseService.ts`
- `src/hooks/useCaisse.ts`
- `src/hooks/useAides.ts`
- `src/components/ReouvrirReunionModal.tsx`

## Nouveaux secrets

- `ADHESION_WEBHOOK_SECRET` (48 chars random) — à transmettre au prestataire de paiement dans le header `x-webhook-secret` lors du POST vers `process-adhesion`.
