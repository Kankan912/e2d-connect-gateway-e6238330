## Approche retenue

Phase par phase, en commençant par le **Bloc Finances** (Phase 3 - calculs). Pour chaque bloc : un rapport d'audit Markdown listant anomalies (attendu / observé / impact / correctif), puis correctifs code commités. Validation utilisateur entre chaque bloc avant de passer au suivant.

## Bloc 1 — Finances (livrable de ce plan)

Audit + corrections sur 4 sous-modules dans cet ordre :

### 1. Cotisations
- Vérifier `useCotisations`, `useCotisationsMensuelles`, `cotisationsLogic.test.ts`
- Cohérence : total membre / total exercice / total réunion / solde
- Source unique des montants (`cotisations_mensuelles_exercice` prioritaire, fallback `cotisations_types`)
- Vérifier filtrage des types via `exercices_cotisations_types.actif`

### 2. Bénéficiaires
- Audit `CalendrierBeneficiaires.tsx`, `useCalendrierBeneficiaires.ts`, `beneficiairesCalculs.ts`
- **Règle de calcul** : `montant = cotisation_mensuelle_du_membre × nb_membres_participants` (PAS de division)
- **Regroupement visuel** : un mois = une carte, plusieurs bénéficiaires regroupés dessous
- **Classement manuel** : bouton Ajouter (membre + mois + rang), librement modifiable
- **Permissions** : édition restreinte à `administrateur` + `tresorier` (via `has_permission` ou `is_admin()`)
- Identifier les écarts vs spec et corriger (UI + RLS si besoin)

### 3. Prêts
- Audit `pretCalculsService.ts`, hooks prêts, `PretsPaiementsManager`, `ReconduireModal`
- **Remboursement partiel** : `capital_restant = capital_restant - montant_remboursé` UNIQUEMENT. Les intérêts initiaux ne doivent JAMAIS être recalculés sur un paiement partiel
- Vérifier capital initial / restant / intérêts / paiements / reconductions / historique
- **Reconduction** :
  - Échéance dépassée → statut `EN_ATTENTE_RECONDUCTION` (à ajouter si absent)
  - Validation par Admin / Trésorier / Commissaire aux comptes (via `loan_validation_config` étendue ou table dédiée `prets_reconductions`)
  - Validation → historique + notification email + log
  - Refus → motif obligatoire + notification emprunteur
  - Aucune reconduction automatique (vérifier qu'aucun trigger ne le fait)

### 4. Caisse
- Audit `useCaisse`, `CaisseDashboard`, `caisseCalculations.test.ts`, RPCs `get_caisse_synthese()` / `get_caisse_stats()` / `get_solde_caisse()`
- **Source unique** : dashboard, synthèse, détails doivent tous lire la MÊME RPC (`get_caisse_synthese`)
- Lister chaque écart entre les 3 vues + remplacer par appel RPC unifié
- Vérifier fonds sport, fonds caisse, prêts décaissés, remboursements, solde empruntable (80% — déjà en mémoire)

## Livrables Bloc 1

1. `docs/AUDIT_FINANCES.md` — tableau anomalies (fonctionnalité / attendu / observé / impact / correctif)
2. Correctifs code (hooks, composants, RPCs via migration si nécessaire)
3. Tests Vitest mis à jour pour couvrir les règles critiques (remboursement partiel, calcul bénéficiaire, source unique caisse)
4. Mise à jour `mem://` si nouvelles règles découvertes

## Hors scope (blocs suivants, à valider après)

- Bloc 2 : Réunions + Présences
- Bloc 3 : Email + Notifications + Users + Logs
- Bloc 4 : Matchs + Site + Galerie (albums Facebook-like) + Navigation
- Bloc 5 : UX globale + format API uniforme `{success, code, message}` + suppression messages techniques

## Méthode pour ce bloc

1. Lecture exhaustive des fichiers finance listés
2. Requêtes `supabase--read_query` ciblées pour vérifier les données réelles (ex: bénéficiaires multiples sur un mois, prêts en retard sans reconduction)
3. Rédaction du rapport AVANT correctifs
4. Correctifs commités par sous-module (cotisations → bénéficiaires → prêts → caisse)
5. Pause pour validation utilisateur avant Bloc 2
