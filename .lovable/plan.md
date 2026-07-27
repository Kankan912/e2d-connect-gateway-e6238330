
# Reliquats à corriger — état vérifié et plan d'exécution

## Ce qui est déjà clos (vérifié)
- Lots 1 et 2 (P0 sécurité + CI + headers Vercel) : livrés.
- CORS partagé : les 21 Edge Functions importent bien `_shared/cors.ts`.
- Sentry : `initSentry()` appelé depuis `src/main.tsx`.
- Code mort : `Breadcrumbs.tsx` / `MediaLibrary.tsx` supprimés.
- Filtre types de cotisation par exercice : présent dans `useCotisations.ts`.
- Lot B (RPC auto-fill + validation paiement, widget, onglet calendrier annuel) et Lot C (RPC `get_membre_situation`, page Ma Situation, trigger justificatif) : fonctionnels.

## Ce qui reste ouvert (constaté dans le code)
1. **Lot A non câblé** — `src/hooks/useExerciseContributionSettings.ts` et `src/domain/finance/CotisationPaymentEngine.ts` n'ont aucun consommateur hors tests : pas d'écran admin, pas de badge de statut, pas de contrôle du nombre max de cotisations mensuelles.
2. **Lot B — livrables documentaires manquants** : `docs/LOT_B_BENEFICIAIRES.md` absent ; le modal de validation est inline dans le widget au lieu d'un composant dédié.
3. **Lot 4 qualité** : `strictNullChecks: false` dans `tsconfig.json` ; bypass admin front (`usePermissions.ts`, `if (isAdministrateur) return true`) ; composants > 400 lignes (`EmailConfigManager`, `ClotureReunionModal`, `PretsAdmin`) ; a11y et tokens de design.
4. **Lot 3/5 restes** : uniformisation du formatage devise vers `useCurrencyFormatter`, singleton realtime des demandes de prêt, fusion `useCaisseStats` + `useCaisseSoldeSnapshot`.

---

## Lot A-bis — Câblage cotisations par exercice (priorité 1, valeur métier)

- Nouvel écran `src/pages/admin/ExerciseContributionSettingsAdmin.tsx` : sélection d'exercice, formulaire (montant mensuel, nb mois, max cotisations/membre), historique des modifications, bouton de déverrouillage admin via RPC `unlock_cotisation` avec motif obligatoire.
- Route + entrée de navigation dans l'espace configuration.
- Branchement de `CotisationPaymentEngine.computeStatus` dans les listes de cotisations : badge Rouge / Orange / Vert (`PAYMENT_STATUS_COLOR`) dans `CotisationsAdmin`, `MyCotisations`, `CotisationsTab`.
- Contrôle `max_cotisations_mensuelles_par_membre` à la saisie (blocage + message) dans le formulaire d'ajout de cotisation mensuelle.
- Migration SQL : trigger qui passe `verrouille = TRUE` dès que `montant_paye >= montant_du` sur `cotisations_membres`.

## Lot B-bis — Finition bénéficiaires

- Extraction du modal inline en `src/components/ValiderPaiementBeneficiaireModal.tsx` (même comportement, réutilisable depuis le widget et la clôture).
- Tests Vitest sur le calcul prévisionnel et l'idempotence de l'auto-remplissage.
- `docs/LOT_B_BENEFICIAIRES.md` : règles, workflow, tables et RPC impactées.

## Lot Q — Qualité et sécurité front

- `usePermissions.ts` : retrait du court-circuit administrateur ; les droits viennent de `has_permission()` seule (avec vérification préalable que les rôles admin possèdent bien toutes les permissions en base, sinon migration de complétion).
- Découpage de `EmailConfigManager`, `ClotureReunionModal`, `PretsAdmin` en sous-composants < 400 lignes, sans changement fonctionnel.
- `strictNullChecks: true` puis correction du fallout, module par module (finance → hooks → pages).
- Passe a11y (`aria-label` sur boutons icon-only) et remplacement des couleurs codées en dur par des tokens sémantiques.

## Lot P — Performance et cohérence d'affichage

- Codemod devise : remplacement des `toLocaleString + ' FCFA'` / `formatFCFA` par `useCurrencyFormatter().format()` sur les pages et exports PDF.
- `LoanRequestsRealtimeProvider` en singleton (un seul canal Supabase).
- Fusion `useCaisseStats` + `useCaisseSoldeSnapshot` en `useCaisseFinance()`.

---

## Ordre proposé
A-bis → B-bis → Q → P. A-bis est le seul lot avec un impact utilisateur direct (les règles de cotisation par exercice restent inexploitables aujourd'hui) ; Q contient le point sécurité le plus sensible (bypass admin front).

## Vérification
`bunx vitest run`, typecheck, puis scénario manuel : créer un paramétrage d'exercice → vérifier badge de statut sur une cotisation partielle → tenter une 3e cotisation mensuelle au-delà du max → contrôler le refus.
