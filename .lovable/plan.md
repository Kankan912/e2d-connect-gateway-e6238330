# Plan final — Consolidation post-refonte (Lots 9 → 11)

Trois chantiers parallèles pour finaliser l'application avant publication.

---

## Lot 9 — Tests unitaires critiques

**Objectif :** sécuriser les calculs financiers et la logique métier sensible avec des tests Vitest exécutables.

### Couverture cible
1. **`src/lib/pretCalculsService.test.ts`** (nouveau)
   - Calcul intérêt direct (montant × taux).
   - Calcul reconduction (priorité `prets_reconductions.interet_mois`).
   - Calcul prorata bénéficiaires (12 mois).
   - Reste à payer selon statut (rembourse / partiel / en_retard / reconduit).

2. **`src/lib/caisseCalculations.test.ts`** (nouveau)
   - Solde empruntable = 80 % × fond − prêts en cours.
   - Cas limites : fond négatif, prêts > 80 %, pourcentage personnalisé.

3. **`src/lib/cotisationsLogic.test.ts`** (nouveau)
   - Priorité `cotisations_mensuelles_exercice` puis fallback `cotisations_types`.
   - Filtrage des types par `actif = true`.

4. **Script de test** : ajout dans `package.json` :
   - `"test": "vitest run"`
   - `"test:watch": "vitest"`

### Hors scope
- Pas de Playwright / E2E (lourd à mettre en place, peu rentable pour ce type d'app interne).
- Pas de tests UI (couverture déjà faite manuellement).

---

## Lot 10 — Documentation

**Objectif :** synchroniser la doc avec les changements des Lots 1 → 8.

### Fichiers à mettre à jour
1. **`docs/ARCHITECTURE.md`** — ajouter sections :
   - Stratégie ErrorBoundary 2 niveaux.
   - `lazyWithRetry` et stabilité chunks.
   - Synchro serveur sport (trigger DB).
   - Fiabilisation emails (retry + log centralisé).

2. **`docs/GUIDE_UTILISATEUR.md`** — ajouter :
   - Workflow réouverture réunion (`terminée` → `en_cours`).
   - Gestion albums galerie.
   - Verrouillage exercice actif.

3. **`docs/IMPLEMENTATION_CHECKLIST.md`** — cocher les lots 1 → 8.

4. **`docs/CHANGELOG.md`** (nouveau) — récapitulatif versionné des 8 lots.

---

## Lot 11 — Audit sécurité final

**Objectif :** valider qu'aucune régression sécurité n'a été introduite.

### Étapes
1. **Linter Supabase** (`supabase--linter`) :
   - Vérifier RLS activé partout.
   - Détecter fonctions sans `search_path`.
   - Vérifier policies non permissives.

2. **Scan sécurité** (`security--run_security_scan`) :
   - Détecter colonnes sensibles exposées.
   - Vérifier policies INSERT/UPDATE/DELETE.

3. **Mémoire sécurité** (`security--update_memory`) :
   - Documenter les choix volontaires (ex : `site_events` lecture publique).

### Corrections
- Correction immédiate des warnings critiques (ERROR / WARN).
- Documentation des INFO ignorés volontairement dans la mémoire sécurité.

---

## Détails techniques

```text
Ordre d'exécution recommandé :
  Lot 11 (audit) → Lot 9 (tests) → Lot 10 (docs) → publication
```

**Pourquoi cet ordre :** l'audit sécurité peut révéler des migrations correctives à faire ; les tests valideront que ces correctifs n'ont rien cassé ; la doc reflètera l'état final.

**Migrations attendues :** probablement 0 à 2 (dépendant des warnings du linter).

**Edge functions impactées :** aucune (modifs déjà faites au Lot 5).

---

## Livrables

- 3 nouveaux fichiers de tests Vitest exécutables (`bun run test`).
- 4 fichiers docs à jour + CHANGELOG.
- Rapport sécurité avec 0 warning critique.
- Application prête à être publiée.

Validez ce plan pour que je passe en mode build et exécute l'ensemble.
