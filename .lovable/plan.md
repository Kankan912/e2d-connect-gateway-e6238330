# Plan : Finaliser les lots restants (G2, G3, G5)

Trois lots restent ouverts dans `.lovable/plan.md`. Objectif : les terminer en séquence sans toucher au métier.

## Lot G3 — Supprimer les `any` résiduels (le plus rapide, on commence)

**Cible :** 3 fichiers identifiés dans la revue.
- `src/components/admin/CompteRenduViewer.tsx`
- `src/pages/admin/PretsAdmin.tsx`
- `src/hooks/useSiteContent.ts`

**Méthode :**
- Lire chaque fichier, recenser les `any` (params, états, retours).
- Remplacer par des types issus de `src/types/supabase-joins.ts` ou des interfaces locales `interface XxxRow { ... }`.
- Pour les payloads Realtime, utiliser le cast documenté (mémoire `architecture/type-safety/residual-technical-debt`).

**Vérif :** `rg -n ": any|<any>|as any" <fichiers>` → 0 hors commentaires.

## Lot G5 — `.select('*')` → colonnes explicites (top 10)

**Cible :** repérer via `rg -n "\.select\('\*'\)" src` puis prioriser les 10 fichiers les plus chauds (hooks Caisse, Cotisations, Loans, Reunions, Sport, Donations, Adhesions, Members, Notifications, Site).

**Méthode :**
- Pour chaque requête, lister les colonnes réellement consommées par le composant/hook.
- Remplacer `select('*')` par `select('col1, col2, ...')` en conservant les jointures `relation(*)` quand toutes les colonnes de la relation sont utilisées (sinon les expliciter aussi).
- Aucune modif de filtre / RLS / logique.

**Vérif :** build OK, `bunx vitest run`, et navigation manuelle rapide via preview sur 2-3 écrans (Caisse, Prêts, Cotisations).

## Lot G2 — Découper les 5 composants > 700 lignes

**Cible :** identifier via `find src -name '*.tsx' | xargs wc -l | sort -rn | head -10` puis retenir les 5 dépassant 700 lignes (probablement parmi `PretsAdmin`, `CotisationsAdmin`, `MembersAdmin`, `ReunionDetail`, `MatchDetail`).

**Méthode (par fichier) :**
- Extraire les sous-blocs en composants dans un sous-dossier `components/` colocalisé (ex. `src/pages/admin/prets/_components/PretRow.tsx`).
- Extraire les handlers volumineux en hooks `useXxx.ts` quand pertinent.
- Conserver la même API publique (props, exports default).
- Aucun changement de comportement visible.

**Vérif :** preview de chaque page refactorée, `bunx vitest run`, recompte des lignes (< 400 idéalement).

## Ordre & livrables

1. G3 (≈ 30 min) → commit logique
2. G5 (≈ 1 h)   → commit logique
3. G2 (≈ 2 h)   → commit logique

Mettre à jour `.lovable/plan.md` et `docs/CODE_REVIEW.md` au fil de l'eau (marquer ✅ TERMINÉ pour chaque lot).

## Hors périmètre

- Aucune migration SQL, RLS, Edge Function.
- Aucun changement UI/UX.
- Aucune nouvelle dépendance.
- Aucun ajout de tests (couverture inchangée).

## Question

Confirmes-tu cet ordre (G3 → G5 → G2) et le périmètre, ou veux-tu prioriser autrement (ex. G2 d'abord car plus visible) ?
