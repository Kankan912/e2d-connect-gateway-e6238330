# Plan d'amélioration — Statut final

Dernière vérification : tous les lots scannés via `rg` / `wc -l` sur l'arborescence `src/`.

## Synthèse

| Lot | Objet | Statut |
|-----|-------|--------|
| **G1** | Validation Zod sur les formulaires admin | ✅ TERMINÉ |
| **G2** | Découpe des composants > 700 lignes | ⏳ EN ATTENTE |
| **G3** | Suppression des `any` ciblés | ✅ TERMINÉ |
| **G4** | Audit Realtime + `.map(async)` | ✅ TERMINÉ |
| **G5** | `.select('*')` → colonnes explicites | ⏳ EN ATTENTE |
| **G6** | `aria-label` sur boutons icônes | ✅ TERMINÉ |
| **G7** | `catch (error: unknown)` standardisé | ✅ TERMINÉ |

## Détails lots terminés

- **G1** — 7 formulaires admin (Hero, About, Activities, Events, Gallery, Partners, Messages) passent par un schéma Zod avec `react-hook-form`.
- **G3** — 66 `any` retirés sur `src/hooks/useSiteContent.ts` (17), `src/pages/admin/PretsAdmin.tsx` (13), `src/components/CompteRenduViewer.tsx` (36). Types nommés (`PresenceRow`, `CotisationRow`, …) + casts via `unknown` aux frontières Supabase. `tsc --noEmit` : 0 erreur.
- **G4** — Doublons d'abonnements Realtime supprimés ; `Array.prototype.map(async …)` remplacé par `Promise.all(map(async …))` là où c'était requis.
- **G6** — `aria-label` ajouté sur tous les boutons `size="icon"` / `size="sm"` sans texte.
- **G7** — Tous les `catch (e|err|error)` typés `unknown`, accès message via `getErrorMessage()`, erreurs Edge Functions extraites via `data?.error`.

## Lots restants

### G2 — Découpe des composants > 700 lignes

5 fichiers cibles (relevé `find src -name '*.tsx' | xargs wc -l | sort -rn`) :

| Fichier | Lignes |
|---------|--------|
| `src/pages/admin/PaymentConfigAdmin.tsx` | 1037 |
| `src/pages/admin/PretsAdmin.tsx` | 977 |
| `src/components/CompteRenduViewer.tsx` | 880 |
| `src/pages/admin/RapportsAdmin.tsx` | 877 |
| `src/pages/Epargnes.tsx` | 762 |

Méthode prévue : extraire les sous-blocs dans `./_components/` colocalisés, sortir les handlers volumineux en hooks, conserver l'API publique (export default, props). Cible : < 400 lignes par fichier racine.

### G5 — `.select('*')` → colonnes explicites

91 fichiers concernés au total. Top 10 prioritaires (relevé `rg -n "\.select\('\*'\)" src --count-matches`) :

| Fichier | Occurrences |
|---------|-------------|
| `src/hooks/useSiteContent.ts` | 11 |
| `src/pages/EventDetail.tsx` | 5 |
| `src/components/CotisationsCumulAnnuel.tsx` | 5 |
| `src/pages/GestionPresences.tsx` | 4 |
| `src/hooks/useE2DPlayerStats.ts` | 4 |
| `src/components/SportStatistiquesGlobales.tsx` | 4 |
| `src/pages/admin/PretsAdmin.tsx` | 3 |
| `src/hooks/useRoles.ts` | 3 |
| `src/hooks/usePersonalData.ts` | 3 |
| `src/hooks/useLoanRequests.ts` | 3 |

Méthode prévue : pour chaque requête, expliciter les colonnes réellement consommées par le composant/hook ; conserver `relation(*)` si toutes les colonnes de la jointure sont utilisées. Aucune modification de filtre / RLS / logique métier.

## Hors périmètre

- Aucune migration SQL, RLS, Edge Function.
- Aucun changement UI/UX.
- Aucune nouvelle dépendance.
- Aucun ajout de tests (couverture inchangée).
