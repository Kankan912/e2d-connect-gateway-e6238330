## Code Review Frontend — Rapport puis corrections par lot

Objectif : audit qualité du code React/TypeScript du projet, livré sous forme de rapport dans `docs/CODE_REVIEW.md`. **Aucune modification de code applicatif** dans cette phase — les corrections viendront après validation, lot par lot.

### Axes d'audit

1. **Typage TypeScript**
   - Occurrences `: any` / `as any` (cibler hooks et services).
   - Props sans interface explicite, retours de fonctions non typés.
   - Types Supabase joins : usage cohérent de `src/types/supabase-joins.ts`.
   - Casts manuels résiduels (rappel : `verrouille`, realtime cast — documentés).

2. **Hooks React**
   - Dépendances `useEffect` / `useMemo` / `useCallback` (rg sur `// eslint-disable-next-line react-hooks/exhaustive-deps`).
   - Hooks appelés conditionnellement.
   - Cleanup manquant (subscriptions Supabase realtime, timers, abort controllers).
   - `useState` dérivés qui devraient être `useMemo`.

3. **Architecture composants**
   - Composants > 400 lignes (candidats au découpage).
   - Pages `src/pages/admin/*` particulièrement volumineuses.
   - Props drilling > 3 niveaux (candidats à context/composition).
   - Logique métier mélangée avec présentation (à extraire en hooks).

4. **Imports & dépendances**
   - Imports inutilisés (`tsc --noUnusedLocals` indirect via rg).
   - Imports relatifs profonds (`../../../`) → alias `@/`.
   - Dépendances `package.json` non utilisées.

5. **Patterns Supabase côté client**
   - Requêtes N+1 dans les boucles `.map(async)`.
   - `.select('*')` sur tables volumineuses au lieu de colonnes ciblées.
   - Pagination absente sur listes potentiellement grandes (membres, opérations caisse).
   - Realtime subscriptions sans dédoublonnage.

6. **Formulaires & validation**
   - Présence systématique de zod + react-hook-form sur les formulaires critiques (auth, prêt, cotisation, adhésion, don).
   - Messages d'erreur localisés FR.
   - Limites longueur / format / sanitization.

7. **Accessibilité & UX (rappel Core)**
   - `aria-label` sur boutons icônes uniquement.
   - Focus management sur Dialog / Modal.
   - Contrast ratio sur badges custom.

8. **Conformité Core rules (re-check)**
   - `console.*` résiduels (post Lot E).
   - `catch (error)` non typés résiduels.
   - `window.confirm` (doit rester à 0).
   - Devise FCFA, rôle `administrateur`, filtre `est_membre_e2d`.
   - Padding mobile `p-3 sm:p-6` sur conteneurs.

### Méthode

- Scans via `rg` ciblés, comptage par axe, top 10 fichiers concernés par axe.
- Lecture des 10 plus gros composants pour évaluer la complexité réelle.
- Inspection LSP ponctuelle sur les hooks/services centraux (`AuthContext`, `useLoanRequests`, `useCotisations`, `useCaisse`).
- **Aucune commande mutative**, aucune édition de code applicatif.

### Livrable unique

**`docs/CODE_REVIEW.md`** structuré ainsi :
- Synthèse exécutive (score qualité par axe, top risques).
- Tableau des findings par axe (sévérité bloquant/majeur/mineur, fichier:ligne, recommandation).
- Plan de correction proposé en **lots G1 à G6** (un lot par axe prioritaire) avec estimation effort.
- Annexe : liste exhaustive des fichiers touchés par axe.

### Hors périmètre (cette phase)

- Audit backend / Edge Functions / RLS (déjà couvert par Lots A→F).
- Performance bundle / Lighthouse.
- Refonte visuelle.
- Toute modification de code applicatif (interviendra après validation des lots G).

### Étape suivante

Après livraison du rapport, vous choisissez quels lots G lancer et dans quel ordre.
