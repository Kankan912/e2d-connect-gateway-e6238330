## État vérifié des lots

Lots clos (vérifiés dans le code) : Lot 1 (P0 sécurité), Lot 2 (CI + CSP), Lots 3–5 (perf/nettoyage), Lot A + A-bis (moteur cotisations, écran `ExerciseContributionSettingsAdmin`, `PaymentStatusBadge`), Lot B (RPC + widget + onglet calendrier), Lot C (RPC `get_membre_situation` corrigée, page `MaSituation`).

Reliquats constatés :

| Lot | Constat vérifié |
|---|---|
| B-bis | `docs/LOT_B_BENEFICIAIRES.md` absent ; `BeneficiairesReunionWidget.tsx` = 458 lignes avec 2 dialogs inline (aucun dossier `src/components/beneficiaires/`) |
| Q1 | `usePermissions.ts` ligne 21/32 : `if (isAdministrateur) return true` court-circuite les permissions granulaires |
| Q2 | `tsconfig.json` : `strictNullChecks: false` ; `tsconfig.app.json` : `strict: false` |
| Q3 | 7 fichiers > 590 lignes (EmailConfigManager 928, ClotureReunionModal 720, PretsAdmin 673, CalendrierBeneficiairesManager 668, UtilisateursAdmin 661, CaisseAdmin 636, MemberDetailSheet 625) |
| P | 60 fichiers utilisent `formatFCFA` (devise codée en dur) vs 4 seulement `formatCurrencyForAssociation` — le multi-tenant/i18n du Lot 6 n'est pas propagé |

## Plan d'exécution

### Lot B-bis — Finition bénéficiaires (rapide)
1. Extraire le dialog de paiement dans `src/components/beneficiaires/ValiderPaiementBeneficiaireModal.tsx` (props : `beneficiaireId`, `open`, `onOpenChange`, `onSuccess`), extraire aussi le dialog d'assignation dans `AssignerBeneficiaireModal.tsx`.
2. Réduire `BeneficiairesReunionWidget.tsx` à la liste + l'orchestration des deux modales.
3. Rédiger `docs/LOT_B_BENEFICIAIRES.md` (RPC `auto_fill_reunion_beneficiaires`, `valider_paiement_beneficiaire`, trigger, écrans, vérifs manuelles).

### Lot Q1 — Permissions granulaires (sécurité)
1. Retirer le bypass `isAdministrateur` de `hasPermission` / `canAccessResource` ; conserver un `isAdmin` exposé pour les usages UI explicites.
2. Vérifier par requête que le rôle `administrateur` possède bien toutes les lignes `role_permissions` nécessaires ; compléter par migration de données si des ressources manquent (sinon l'admin perdra des écrans).
3. Étendre `src/test/security/rls.test.ts` / `docs/PERMISSIONS_TESTS.md` avec un cas « admin sans permission explicite ».

### Lot Q2 — strictNullChecks
1. Activer `strictNullChecks: true` (puis `strict` côté app si le volume reste tenable), lancer `tsgo` et récupérer la liste d'erreurs.
2. Corriger par vagues thématiques : `src/domain/finance/*`, puis hooks, puis pages — en privilégiant les gardes (`?.`, `??`) plutôt que les `!`.
3. Aucune modification de logique métier ; la CI (typecheck déjà présent dans `ci.yml`) sert de garde-fou.

### Lot Q3 — Découpage des gros composants
Ordre par risque décroissant, un composant par étape, avec extraction en sous-composants `_components/` + hook de données dédié :
1. `EmailConfigManager.tsx` (928) → onglets provider / SMTP / test.
2. `ClotureReunionModal.tsx` (720) → étapes de clôture (sanctions, cotisations, récapitulatif).
3. `PretsAdmin.tsx` (673) et `CaisseAdmin.tsx` (636) → tableaux + filtres + modales séparés.
4. `UtilisateursAdmin.tsx` (661), `CalendrierBeneficiairesManager.tsx` (668), `MemberDetailSheet.tsx` (625).

### Lot P — Unification devise & realtime
1. Créer un hook unique `useMoney()` s'appuyant sur `formatCurrencyForAssociation` + `AssociationContext`, et migrer progressivement les 60 fichiers `formatFCFA` (garder `formatFCFA` comme alias déprécié pour les exports PDF hors React).
2. Auditer les abonnements realtime (`useRealtimeUpdates`, `useSupabaseRealtime`) : un seul canal partagé par table, cleanup systématique.
3. Mettre à jour `docs/CHANGELOG.md` et `docs/I18N_THEMING.md`.

## Ordre recommandé
B-bis → Q1 → P → Q3 → Q2 (le passage en strict en dernier, une fois les fichiers découpés, pour limiter le volume d'erreurs à traiter).

## Détails techniques
- Aucune migration SQL nouvelle n'est nécessaire, sauf éventuellement un `INSERT` de complétion dans `role_permissions` au Lot Q1 (via l'outil de données, pas une migration de schéma).
- Les changements Q1 sont les seuls à impact fonctionnel visible immédiat : à valider en préview avec un compte administrateur avant publication.
