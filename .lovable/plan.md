# Plan : Code Review Complet du Projet E2D

Le projet est volumineux (40+ pages admin, 30+ hooks, 18 edge functions, ~80 tables). Une revue exhaustive ligne-par-ligne dépasserait largement la limite raisonnable d'une session. Je propose donc une revue **structurée par modules**, avec livrable écrit (rapport Markdown) et corrections appliquées en lot après validation.

## Périmètre

### 1. Sécurité & Backend
- **RLS** : revue des politiques par table (publiques vitrine vs privées admin)
- **Edge Functions** (18) : auth, validation d'entrée, CORS, gestion d'erreurs, secrets
- **Fonctions DB / Triggers** : `SECURITY DEFINER`, `search_path`, cohérence
- **Secrets** : vérifier qu'aucun n'est exposé côté client
- Lancer `security--run_security_scan` + `supabase--linter`

### 2. Modules métier (un par un)
Pour chacun : hooks, composants, pages admin, logique calcul, intégration caisse
- **Cotisations** (mensuelles, exercices, cumul annuel)
- **Caisse** (synthèse, opérations, soldes, prêts en cours)
- **Prêts** (demandes, workflow validation, reconductions, paiements, statuts)
- **Épargnes & Bénéficiaires** (calendrier, prorata intérêts, distributions)
- **Aides** (allocation, sync caisse)
- **Réunions** (présences, sanctions, clôture, réouverture)
- **Sport** (E2D, Phoenix, matchs, stats, médias)
- **Adhésions & Donations** (Mobile Money, transferts, réconciliation)
- **Notifications** (campagnes, templates, multi-provider email)
- **Utilisateurs / Rôles / Permissions** (granular permissions, lifecycle)
- **CMS Site vitrine** (Hero, About, Events, Gallery, Partners)

### 3. Architecture & Qualité
- **Dépendances** (`package.json`) : versions, vulnérabilités (`bun audit`), packages inutilisés
- **Type-safety** : `any` résiduels, jointures Supabase typées (`src/types/supabase-joins.ts`)
- **Hooks génériques** vs duplications, React Query (staleTime, invalidations)
- **Routing & lazy loading** (`lazyWithRetry`, ErrorBoundary 2 niveaux)
- **Logger** (production strip), gestion d'erreurs (`catch unknown`, `data?.error`)
- **Tests** existants (Vitest) : couverture, tests cassés
- **Performance** : requêtes N+1, listes non virtualisées, bundle size
- **Accessibilité & SEO** : alt, H1 unique, semantic HTML

### 4. Cohérence UX
- Mobile responsive (padding `p-3 sm:p-6`)
- AlertDialog vs `window.confirm`
- Tokens design (`hsl(var(--…))`) vs couleurs en dur
- Devise FCFA partout, rôle `administrateur` (pas `admin`)

## Livrables

1. **Rapport `docs/CODE_REVIEW_2026_05.md`** — pour chaque module :
   - État (OK / Mineur / Majeur / Critique)
   - Problèmes détectés (avec fichier:ligne)
   - Recommandations
2. **Tableau récap** des bugs / risques sécurité / dette technique, priorisé
3. **Corrections critiques appliquées immédiatement** (sécurité, bugs bloquants)
4. **Corrections mineures** : liste à valider avant exécution

## Méthode

```text
Phase 1 : Audit automatisé (15 min)
  - security_scan + supabase linter + dependency scan + tests existants
Phase 2 : Revue par module (lecture ciblée)
  - hooks → composants → pages → fonctions DB associées
Phase 3 : Rédaction rapport + classement priorités
Phase 4 : Application des fixes critiques
Phase 5 : Présentation des fixes optionnels pour validation
```

## Question avant de démarrer

Vu l'ampleur, dis-moi quelle **profondeur** tu veux :

- **A — Express (1 passe)** : audits automatisés + survol rapide tous modules + rapport synthétique + fixes critiques uniquement.
- **B — Standard (recommandé)** : tout le périmètre ci-dessus, rapport détaillé, fixes critiques + majeurs appliqués.
- **C — Approfondi** : B + revue ligne-par-ligne des modules sensibles (Caisse, Prêts, Cotisations, Bénéficiaires) + tests unitaires ajoutés sur les calculs financiers.

Réponds **A**, **B** ou **C** (ou précise un sous-ensemble de modules à prioriser).
