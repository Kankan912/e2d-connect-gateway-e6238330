# Plan d'amélioration — Statut final

Dernière mise à jour après finalisation G2.

## Synthèse globale

| Lot | Objet | Statut |
|-----|-------|--------|
| **G1** | Validation Zod (formulaires admin) | ✅ TERMINÉ |
| **G2** | Découpe composants > 700 lignes | ✅ TERMINÉ |
| **G3** | Suppression des `any` ciblés | ✅ TERMINÉ |
| **G4** | Audit Realtime + `.map(async)` | ✅ TERMINÉ |
| **G5** | `.select('*')` → colonnes explicites (top 10) | ✅ TERMINÉ |
| **G6** | `aria-label` icônes | ✅ TERMINÉ |
| **G7** | `catch (error: unknown)` standardisé | ✅ TERMINÉ |

## G2 — Découpe finalisée (5/5)

Tous les fichiers > 700 lignes du périmètre initial sont passés sous la barre. Typecheck OK.

| Fichier | Avant | Après | Extractions |
|---------|-------|-------|-------------|
| `src/components/CompteRenduViewer.tsx` | 880 | **561** | `src/lib/compte-rendu-pdf.ts` |
| `src/pages/admin/PretsAdmin.tsx` | 977 | **685** | `_components/ReconductionsAttenteList.tsx`, `_components/PretsStatsCards.tsx`, `_components/PretRow.tsx` |
| `src/pages/admin/PaymentConfigAdmin.tsx` | 1037 | **473** | `_components/PaymentConfigTabs.tsx` (6 onglets) |
| `src/pages/admin/RapportsAdmin.tsx` | 877 | **429** | `src/lib/rapports-export.ts`, `_components/RapportsTabsContent.tsx` |
| `src/pages/Epargnes.tsx` | 762 | **531** | `pages/_components/EpargnesFilters.tsx`, `pages/_components/EpargnesList.tsx` |

**Reste :** `src/components/ClotureReunionModal.tsx` (719 l.) hors périmètre initial — à traiter dans une itération future. `src/integrations/supabase/types.ts` (5 709 l.) est auto-généré, ignoré.

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

## Hors périmètre (rappel)

- Aucune migration SQL, RLS, Edge Function.
- Aucun changement UI/UX visible.
- Aucune nouvelle dépendance.
- Aucun ajout de tests.
