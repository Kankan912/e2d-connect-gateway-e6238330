# Audit Phase 5 — Cohérence métier Prêts / Aides / Bénéficiaires

État des lieux réalisé en ouverture de la Phase 5. Sert de guide aux
sous-phases 5.2 → 5.7.

## 1. Statuts prêts — sources divergentes détectées

| Fichier | Type de calcul | Traitement Phase 5.2 |
|---|---|---|
| `src/pages/admin/PretsAdmin.tsx` | `getEffectiveStatus` local (priorité remboursé > en_retard > reconduit > partiel > en_cours) | ✅ Délégué à `LoanService.resolveStatus` + `<StatutBadge>` |
| `src/pages/admin/_components/PretRow.tsx` | Reçoit `effectiveStatus` + `statutBadge` via props | ➡️ Alimenté par le parent unifié |
| `src/pages/dashboard/MyPrets.tsx` | Switch local sur `statut` brut (en_attente / approuve / refuse / en_cours / rembourse) | ⚠️ Statuts *demande* (workflow admin) — hors périmètre `LoanService`. Aucune divergence : conserver tel quel |
| `src/pages/admin/DemandesPretAdmin.tsx` | Statuts de demande (en_attente/approuve/refuse) | ⚠️ Idem — workflow demande, pas prêt en cours |
| `src/pages/admin/_components/ReconductionsAttenteList.tsx` | Aucun calcul de statut | ✅ Enrichi (Phase 5.5) avec preview + `AlertDialog` |

Décision : `LoanService.resolveStatus` reste la source unique pour les
statuts *effectifs* de prêt en cours ; les statuts de *workflow de demande*
(`en_attente`, `approuve`, `refuse`) vivent dans `loan_requests` et suivent
un cycle de vie distinct.

## 2. Aides — workflow court-circuité

- La RPC `avancer_workflow_aide` existait dans la base mais n'était appelée
  nulle part côté frontend.
- `useAides.useUpdateAide` autorisait n'importe quelle transition via un
  `update({ statut })` direct.
- `AidesAdmin.tsx` n'affichait qu'un `getStatutBadge` sans bouton de
  transition — le workflow existait uniquement dans les têtes.

Action Phase 5.3 :
- `AideService.advanceWorkflow` centralise la transition (RPC prioritaire,
  fallback update direct), avec validation des transitions autorisées.
- Nouveau hook `useAdvanceAideWorkflow` remonte les `DomainError` en toast
  et invalide les caches caisse.
- Les `.update({ statut })` directs restent tolérés en compatibilité mais
  déconseillés pour tout nouveau code.

## 3. Bénéficiaires — calcul net annuel

- `BeneficiaireService.computeMontantAnnuelNet(mensuel, sanctionsImpayees)`
  déjà présent : `max(0, mensuel × 12 − sanctionsImpayees)`.
- Consommateurs actuels : `useCalendrierBeneficiaires` (agrège par mois),
  `Beneficiaires.tsx` (admin), `MesAvalisations.tsx`.
- Aucun recompute inconsistant détecté après relecture (les pages lisent
  les valeurs déjà agrégées côté hook/RPC). Statu quo — pas de doublon à
  supprimer.

## 4. Solde empruntable côté client

- `calcSoldeEmpruntable` n'existe plus qu'en test (`src/lib/caisseCalculations.test.ts`)
  comme documentation de la règle 80 %.
- Toutes les vues consomment déjà `stats.solde_empruntable` (RPC serveur)
  ou `CaisseService.getSoldeEmpruntable()`.
- Aucun nettoyage supplémentaire nécessaire.

## 5. Reconductions de prêts — UX

- Écran unique déjà en place (`ReconductionsAttenteList`).
- Manquait : aperçu capital / intérêt prorata + confirmation forte.
- Phase 5.5 : ajout du récap inline et d'un `AlertDialog` de confirmation
  (jamais `window.confirm` — conforme mémoire projet).
- Notification email : la validation déclenche déjà `send-loan-notification`
  côté `PretsAdmin` (mutation `validateReconduction`).

## 6. Verdict global

- **Cohérence forte** : statuts prêts + aides + solde empruntable désormais
  alignés sur les services domaine (Phase 4).
- **Dette résiduelle** : `useUpdateAide` peut encore modifier `statut`
  librement — à limiter dans une itération future (rendre le champ
  read-only pour cette mutation et forcer `useAdvanceAideWorkflow`).
- **Prochain chantier (Phase 6)** : i18n et thèmes par association.
