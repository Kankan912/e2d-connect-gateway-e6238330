# Plan : Finaliser G5 puis G2

## G5 — `.select('*')` → colonnes explicites (top 10)

Ordre par risque croissant (lecture seule d'abord, métier ensuite).

| # | Fichier | Approche |
|---|---------|----------|
| 1 | `src/hooks/useRoles.ts` | 3 requêtes, schéma simple (`roles`, `user_roles`) |
| 2 | `src/hooks/usePersonalData.ts` | 3 requêtes user-scoped |
| 3 | `src/hooks/useE2DPlayerStats.ts` | 4 requêtes stats |
| 4 | `src/hooks/useLoanRequests.ts` | 3 requêtes loan_requests |
| 5 | `src/hooks/useSiteContent.ts` | 11 requêtes CMS (lecture) |
| 6 | `src/pages/EventDetail.tsx` | 5 requêtes site_events |
| 7 | `src/components/CotisationsCumulAnnuel.tsx` | 5 requêtes agrégation |
| 8 | `src/components/SportStatistiquesGlobales.tsx` | 4 requêtes stats |
| 9 | `src/pages/GestionPresences.tsx` | 4 requêtes présences |
| 10 | `src/pages/admin/PretsAdmin.tsx` | 3 requêtes restantes |

Méthode par fichier :
1. Lire le composant pour relever les colonnes consommées.
2. Remplacer `select('*')` par la liste explicite ; conserver `relation(*)` quand toutes les colonnes de la jointure sont utilisées.
3. `tsc --noEmit` après chaque batch de 3 fichiers pour détecter une régression de typage.

Aucun changement de filtre, RLS ou logique.

## G2 — Découpe composants > 700 lignes

Ordre par taille décroissante.

| # | Fichier | Lignes | Stratégie d'extraction |
|---|---------|--------|------------------------|
| 1 | `src/pages/admin/PaymentConfigAdmin.tsx` | 1037 | Sortir chaque onglet (Stripe, Paddle, Mobile Money, Virement) en sous-composant dans `./_components/` |
| 2 | `src/pages/admin/PretsAdmin.tsx` | 977 | Extraire `PretsTable`, `PretsDashboardCards`, `ReconductionsAttenteList`, hook `usePretsMutations` |
| 3 | `src/components/CompteRenduViewer.tsx` | 880 | Sortir le générateur PDF (`handleDownloadPDF`) en `src/lib/compte-rendu-pdf.ts` + sections en sous-composants |
| 4 | `src/pages/admin/RapportsAdmin.tsx` | 877 | Un sous-composant par onglet rapport |
| 5 | `src/pages/Epargnes.tsx` | 762 | Extraire `EpargnesTable`, `EpargnesStats`, formulaire en sous-composant |

Règles communes :
- Conserver l'export default et les props publiques.
- Aucun changement de comportement visible (UI, requêtes, handlers identiques).
- Cible : fichier racine < 400 lignes.
- Vérif : `tsc --noEmit`, `bunx vitest run`, lecture rapide en preview de chaque page touchée.

## Livrables

- Mise à jour `.lovable/plan.md` au fil de l'eau (cocher chaque fichier).
- Section finale G5 ✅ / G2 ✅ dans `docs/CODE_REVIEW.md`.

## Hors périmètre

- Aucune migration SQL, RLS, Edge Function.
- Aucun changement UI/UX visible.
- Aucune nouvelle dépendance.
- Aucun nouveau test (couverture inchangée).

## Volumétrie estimée

≈ 30 éditions de fichiers, plusieurs typechecks intermédiaires. Le travail sera fait d'une traite jusqu'à G5 ✅ + G2 ✅.
