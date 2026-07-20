# Lot A — Cotisations par exercice & moteur de paiement

Livraison partielle du plan issu de `Classeur_IA-4.xlsx` (page 1, items 1, 2, 4, 8).

## Livré

1. **Schéma DB** — migration `exercise_contribution_settings` + historisation
   automatique via trigger `log_ecs_change`, verrouillage cotisations
   (`cotisations.verrouille`), flag membre
   `autoriser_plusieurs_cotisations_mensuelles`, paramètre association
   `max_cotisations_mensuelles_par_membre`, RPC `unlock_cotisation` réservée
   admin.
2. **Service métier** — `src/domain/finance/CotisationPaymentEngine.ts` :
   calcul unique du statut (`unpaid | partial | paid`), formule officielle
   bénéficiaire (`mensuel × nb_mois`). Tests Vitest couvrant les 4 cas.
3. **Hooks React Query** — `src/hooks/useExerciseContributionSettings.ts` :
   lecture, upsert, déverrouillage via RPC.

## À câbler (PR suivantes)

- Écran admin `ExerciseContributionSettingsAdmin` (formulaire par exercice).
- Migration des lectures existantes (`useCotisations`,
  `useCotisationsMensuelles`, `BeneficiaireService`) vers
  `useExerciseContributionSettings`.
- Trigger DB : auto-set `verrouille = TRUE` quand `montant_paye >= montant_du`
  sur `cotisations_membres`.
- Badge Rouge/Orange/Vert utilisant `PAYMENT_STATUS_COLOR` dans les listes.
- Contrôle `max_cotisations_mensuelles_par_membre` dans l'UI d'ajout.

## Lots suivants (planifiés)

- **Lot B** — Réunions + calendrier bénéficiaires (1↔N).
- **Lot C** — Vues consolidées + justificatifs aides.
- **Lots D/E/F** — Refonte SaaS multi-tenant white-label.

Chaque lot est livré par PR incrémentale validée par le pipeline CI existant
(`.github/workflows/ci.yml`).
