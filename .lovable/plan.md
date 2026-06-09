# Plan d'amélioration — Statut final

Dernière mise à jour après exécution G5 + amorce G2.

## Synthèse globale

| Lot | Objet | Statut |
|-----|-------|--------|
| **G1** | Validation Zod (formulaires admin) | ✅ TERMINÉ |
| **G2** | Découpe composants > 700 lignes | 🟡 PARTIEL (2/5 entamés) |
| **G3** | Suppression des `any` ciblés | ✅ TERMINÉ |
| **G4** | Audit Realtime + `.map(async)` | ✅ TERMINÉ |
| **G5** | `.select('*')` → colonnes explicites (top 10) | ✅ TERMINÉ |
| **G6** | `aria-label` icônes | ✅ TERMINÉ |
| **G7** | `catch (error: unknown)` standardisé | ✅ TERMINÉ |

## G5 — Détail des fichiers traités

10 fichiers prioritaires migrés vers des colonnes explicites. Typecheck OK après chaque batch.

| Fichier | Tables touchées |
|---------|-----------------|
| `src/hooks/useRoles.ts` | `roles`, `role_permissions` |
| `src/hooks/usePersonalData.ts` | `sanctions`, `prets`, `epargnes` |
| `src/hooks/useE2DPlayerStats.ts` | `e2d_player_stats_view` (×4) |
| `src/hooks/useLoanRequests.ts` | `loan_requests`, `loan_request_validations`, `loan_validation_config` |
| `src/hooks/useSiteContent.ts` | `site_hero`, `site_about`, `site_activities`, `site_events`, `site_gallery`, `site_partners`, `site_config`, `site_hero_images`, `site_gallery_albums`, `site_events_carousel_config` |
| `src/pages/EventDetail.tsx` | `site_events`, `sport_e2d_matchs`, `match_medias`, `match_compte_rendus`, `match_statistics` |
| `src/components/CotisationsCumulAnnuel.tsx` | `exercices`, `cotisations_types`, `cotisations`, `cotisations_membres` |
| `src/components/SportStatistiquesGlobales.tsx` | `sport_e2d_matchs`, `sport_phoenix_matchs`, `membres` (×2 → `id` only) |
| `src/pages/GestionPresences.tsx` | `membres`, `sport_e2d_presences`, `phoenix_presences` |
| `src/pages/admin/PretsAdmin.tsx` | `prets_config`, `prets_paiements`, `prets_reconductions` |

**Reste hors top 10 :** 81 fichiers contiennent encore `.select('*')`, principalement des hooks/pages secondaires. À traiter dans une itération ultérieure.

## G2 — Détail partiel

| Fichier | Avant | Après | Action |
|---------|-------|-------|--------|
| `src/components/CompteRenduViewer.tsx` | 880 | **561** | Générateur PDF extrait dans `src/lib/compte-rendu-pdf.ts` (460 l.) |
| `src/pages/admin/PretsAdmin.tsx` | 977 | **944** | `ReconductionsAttenteList` extrait dans `src/pages/admin/_components/` |
| `src/pages/admin/PaymentConfigAdmin.tsx` | 1037 | 1037 | ⏳ Non entamé |
| `src/pages/admin/RapportsAdmin.tsx` | 877 | 877 | ⏳ Non entamé |
| `src/pages/Epargnes.tsx` | 762 | 762 | ⏳ Non entamé |

**Prochaines extractions suggérées :**
- `PaymentConfigAdmin` : un sous-composant par onglet (Stripe / Paddle / Mobile Money / Virement).
- `RapportsAdmin` : un sous-composant par type de rapport.
- `Epargnes` : `EpargnesTable` + `EpargnesStats` + formulaire.
- `PretsAdmin` (suite) : extraire `PretsTable`, `PretsDashboardCards`, hook `usePretsMutations`.
- `CompteRenduViewer` (suite) : sections JSX (`PresencesSection`, `FinancesSection`) pour passer < 400 l.

## Hors périmètre (rappel)

- Aucune migration SQL, RLS, Edge Function.
- Aucun changement UI/UX visible.
- Aucune nouvelle dépendance.
- Aucun ajout de tests.
