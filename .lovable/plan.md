

# Réponse aux deux points soulevés

## 1. Clé Supabase en dur dans client.ts — Aucune action requise

La clé présente dans `client.ts` est la **clé publique anon** (publishable key). C'est le comportement **normal et recommandé** par Supabase. Voici pourquoi :

- Les variables d'environnement Vite (`VITE_*`) sont injectées **au build** dans le bundle JavaScript client — elles sont donc **tout aussi visibles** dans les DevTools que des constantes en dur. Les déplacer dans `.env` ne change rien à la sécurité.
- Le fichier `.env` existe déjà avec `VITE_SUPABASE_URL` et `VITE_SUPABASE_PUBLISHABLE_KEY`, mais `client.ts` est auto-généré par Lovable et utilise les constantes directement. C'est cosmétique, pas un risque.
- La **vraie sécurité** repose sur les **politiques RLS**, qui sont déjà en place dans votre projet (cf. `is_admin()`, `has_permission()`, `has_role()`). La clé `service_role` n'est jamais exposée côté client.
- Toutes les opérations sensibles passent déjà par des Edge Functions avec vérification JWT.

**Recommandation** : Aucune modification de code. Concentrer les efforts sur l'audit RLS (déjà fait selon les mémoires projet) plutôt que sur le déplacement de la clé anon.

---

## 2. Tests automatisés — Plan d'implémentation

### Périmètre initial (réaliste dans Lovable)

Lovable ne peut pas exécuter de CI/CD, Playwright, ou des scripts npm. Le plan se concentre sur ce qui est faisable : **tests unitaires Vitest** exécutables via l'outil de test intégré.

### Fichiers à créer/modifier

#### A. Configuration (3 fichiers)

1. **`vitest.config.ts`** — Config Vitest avec jsdom, alias `@/`, setup file
2. **`src/test/setup.ts`** — Setup avec `@testing-library/jest-dom` et mocks globaux (matchMedia)
3. **`tsconfig.app.json`** — Ajouter `"vitest/globals"` aux types

#### B. Dépendances à installer

`@testing-library/jest-dom`, `@testing-library/react`, `@testing-library/user-event`, `jsdom`, `vitest` (devDependencies)

#### C. Tests unitaires prioritaires (4 fichiers)

1. **`src/lib/utils.test.ts`** — Tests pour `formatCurrency`, `formatFCFA`, `getErrorMessage`, `cn`
2. **`src/lib/payment-utils.test.ts`** — Tests pour les utilitaires de paiement
3. **`src/lib/session-utils.test.ts`** — Tests pour les utilitaires de session
4. **`src/lib/pdf-utils.test.ts`** — Tests pour la génération PDF

#### D. Mock Supabase (1 fichier)

5. **`src/test/mocks/supabase.ts`** — Mock du client Supabase pour les tests de hooks

#### E. Test composant (1 fichier)

6. **`src/components/ui/badge.test.tsx`** — Test simple de rendu du Badge (validation du setup)

### Ce qui n'est PAS faisable dans Lovable

- Playwright/Cypress (pas d'exécution de navigateur headless)
- GitHub Actions workflows (pas d'accès au repo Git)
- Badge de couverture (pas de CI)
- MSW (nécessite un service worker, complexe dans le sandbox)

Ces éléments devront être ajoutés manuellement dans le repository par un développeur.

