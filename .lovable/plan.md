# Phase 5 — Prêts, Aides & Bénéficiaires : cohérence métier

Objectif : unifier les workflows, éliminer les incohérences entre modules financiers et améliorer l'ergonomie des reconductions de prêts. Aucun changement de schéma majeur — on s'appuie sur le `FinancialEngine` livré en Phase 4.

## 5.1 — Audit croisé (1 j)

Produire `docs/AUDIT_PHASE5_METIER.md` recensant :
- Divergences entre `LoanService.resolveStatus` (domaine) et les statuts calculés ad-hoc dans `PretRow`, `PretsAdmin`, `MyPrets`, `DemandesPretAdmin`.
- Points où `AideService` workflow (`demandee → validee → allouee → payee`) est court-circuité (mises à jour directes de `statut` dans les hooks/pages).
- Écarts sur `BeneficiaireService` (calcul net annuel vs. affichage `CalendrierBeneficiaires`).
- Duplication du calcul « solde empruntable » côté client (usages restants de `calcSoldeEmpruntable`).

## 5.2 — Unification statuts Prêts (2 j)

- Remplacer chaque calcul local de statut par `LoanService.resolveStatus(...)` dans :
  `src/pages/admin/_components/PretRow.tsx`, `PretsAdmin.tsx`, `MyPrets.tsx`, `DemandesPretAdmin.tsx`, `ReconductionsAttenteList.tsx`.
- Ajouter un helper `useLoanStatus(pret, paiements, reconductions)` mémoïsé.
- Aligner les badges de statut (label + variante) via un mapping unique dans `src/components/prets/StatutBadge.tsx`.

## 5.3 — Workflow Aides verrouillé (2 j)

- Centraliser toutes les transitions dans `AideService.advanceWorkflow(aide, nextStatut, meta)` (déjà partiellement présent).
- Faire passer `useAides` et `AidesAdmin` par ce service — plus aucun `.update({ statut })` direct.
- Ajouter garde-fous : refus des transitions non autorisées, message utilisateur clair (`DomainError` remontée en toast).
- Vérifier que la cascade caisse `allouee → fond_caisse_operations` reste unique (déjà idempotente via `record_caisse_movement`).

## 5.4 — Bénéficiaires : source unique (1,5 j)

- Extraire `BeneficiaireService.computeNetAnnuel(membre, sanctionsImpayees, mensuel)` et l'utiliser à la fois dans `CalendrierBeneficiaires`, `Beneficiaires.tsx` (admin) et `MesAvalisations`.
- Supprimer les recomputes locaux qui divergeaient sur l'arrondi FCFA.
- Prorata intérêts : réutilisation directe de la règle mémoire (`interest-calculation-comprehensive`).

## 5.5 — Reconductions de prêts : UX (2 j)

- Simplifier `ReconductionsAttenteList` : un seul écran validation/refus avec récap intérêts (via `LoanService.computeSummary`).
- Ajouter un aperçu « avant/après » (capital restant, nouvelle échéance, intérêts prorata) avant confirmation.
- Notification email de reconduction validée (réutilise `send-loan-notification`).
- `AlertDialog` de confirmation (jamais `window.confirm`, conforme à la mémoire).

## 5.6 — Nettoyage `calcSoldeEmpruntable` client (0,5 j)

- Remplacer les usages restants par `CaisseService.getSoldeEmpruntable()` (RPC serveur).
- Conserver la fonction pure comme fallback documenté uniquement.

## 5.7 — Tests + documentation (1 j)

- Tests Vitest : transitions Aides interdites, statut prêt en retard/reconduit, net annuel bénéficiaire avec sanctions impayées.
- Mise à jour de `docs/CHANGELOG.md`, `.lovable/plan.md`, et création de `mem://modules/phase5-coherence-metier`.

## Livrables

- 1 doc d'audit, 1 service consolidé (`AideService.advanceWorkflow`), 1 composant badge partagé, 1 hook `useLoanStatus`, écran reconductions revu, batterie de tests, changelog + mémoire.

## Détails techniques

- Aucun changement de schéma SQL prévu. Toute écriture caisse continue via `record_caisse_movement`.
- Les transitions de statut Aides s'appuient sur la RPC existante `avancer_workflow_aide` — le service TS l'enveloppe et normalise les erreurs.
- Le hook `useLoanStatus` est pur côté client, ne fait aucun appel réseau (les données proviennent déjà des queries React Query en amont).
- Effort total estimé : **6-8 jours** (conforme au plan directeur).

## Hors périmètre

- i18n / thèmes (Phase 6).
- Observabilité, sauvegardes (Phase 7).
- Refonte visuelle des pages prêts/aides — on garde l'UI existante, on n'unifie que les données et les workflows.
