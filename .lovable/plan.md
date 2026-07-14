## Audit technique et fonctionnel complet — Livrable unique

Production d'un rapport d'audit exhaustif consolidé dans un seul document : **`docs/AUDIT_COMPLET_2026_07.md`** (analyse statique uniquement, aucun test Playwright, aucune modification de code applicatif).

### Méthodologie

1. **Cartographie exhaustive** via `list_dir` récursif + `rg` pour indexer 100% des fichiers (src/, supabase/, docs/, config racine).
2. **Analyse ciblée en parallèle** grâce à `acp_subagent--explore` — un sous-agent par domaine pour paralléliser la lecture sans saturer le contexte principal :
   - Sous-agent A : Architecture, structure, SOLID, Clean Code, DRY/KISS, code mort
   - Sous-agent B : Composants React, hooks, pages, routes, boutons, formulaires (analyse statique)
   - Sous-agent C : Supabase (RLS, policies, migrations, triggers, RPC, Edge Functions, buckets)
   - Sous-agent D : Sécurité OWASP, JWT, CORS, secrets, upload, escalade privilèges, multi-tenant
   - Sous-agent E : Calculs métier (cotisations, prêts, intérêts, reconductions, bénéficiaires, aides, caisse)
   - Sous-agent F : Dépendances (`package.json` + `bun.lock`), obsolescence, doublons, `dependency_scan`
   - Sous-agent G : Performance (bundle, lazy, memo, N+1), UX/UI/a11y, DevOps (CI, `.github/workflows`, vercel.json)
3. **Consolidation** : synthèse dans un rapport unique structuré selon les 20 étapes demandées.
4. **Aucune modification** du code applicatif, des migrations, ni de la base. Uniquement création du fichier de rapport (+ mise à jour `docs/CHANGELOG.md` et `mem://index.md` en fin).

### Structure du rapport `docs/AUDIT_COMPLET_2026_07.md`

```text
1. Résumé exécutif (verdict, top 10 risques, note globale /100)
2. Étape 1 — Cartographie complète (arbo, modules, tables, RPC, Edge Fns)
3. Étape 2 — Code review (duplication, hooks, useEffect, code mort)
4. Étape 3 — Dépendances (versions, CVE, inutilisées, doublons)
5. Étape 4 — Boutons (statique : handlers, disabled, confirm, loading)
6. Étape 5 — Pages & routes (routes mortes, guards, deep-link)
7. Étape 6 — Formulaires (validation, upload, cas limites)
8. Étape 7 — Fonctionnalités (incomplètes, cassées, orphelines)
9. Étape 8 — Interactions inter-modules (flux Réunion→Cotis→Prêt→Caisse…)
10. Étape 9 — RBAC & droits d'accès (matrice rôles × ressources)
11. Étape 10 — Sécurité OWASP Top 10
12. Étape 11 — Supabase (RLS, policies, buckets, Edge Fns, triggers)
13. Étape 12 — Base de données (relations, index, contraintes, N+1)
14. Étape 13 — Performance (bundle, lazy, memo, pagination)
15. Étape 14 — UX/UI/Accessibilité (responsive, contrastes, feedback)
16. Étape 15 — DevOps (CI/CD, env, rollback, monitoring)
17. Étape 16 — Multi-tenant (isolation association_id, branding, i18n)
18. Étape 17 — Calculs métier (cotisations, prêts, intérêts, reconductions)
19. Étape 18 — Tests fonctionnels (checklist scénarios end-to-end)
20. Étape 19 — TABLEAU CONSOLIDÉ (Module | Fonctionnalité | Fichiers |
     Manquement | Cause | Risque | Résultat attendu | Action détaillée |
     Priorité | Criticité | Effort | Statut)
21. Étape 20 — Statistiques + notes /10 par axe + note globale /100
22. Annexes : glossaire, liens dashboard Supabase, plan de remédiation phasé
```

### Contraintes et limites annoncées dans le rapport

- **Analyse statique** : les bugs runtime dépendant d'état spécifique (données prod, race conditions Realtime, comportements navigateur) sont signalés comme « à confirmer en runtime » mais non testés.
- **Boutons/pages/formulaires** : audit basé sur la lecture des handlers, `onClick`, `onSubmit`, schémas Zod, mutations. Pas de clic réel.
- **RLS** : lecture des définitions SQL uniquement + réutilisation de `supabase--linter` pour vérifications automatisées.
- **Dépendances** : croisement `package.json` ↔ imports réels via `rg`, plus `code--dependency_scan` pour CVE.
- **Livrable unique** : rédaction condensée mais exploitable ; le tableau consolidé (étape 19) est la référence actionnable pour les correctifs.

### Fichiers produits

- **Créé** : `docs/AUDIT_COMPLET_2026_07.md` (le rapport)
- **Modifié** : `docs/CHANGELOG.md` (entrée « Audit complet juillet 2026 »)
- **Modifié** : `mem://index.md` + `mem://audits/complete-2026-07` (référence au rapport)

Aucun autre fichier ne sera touché. Aucune migration SQL, aucun changement de code applicatif, aucune modification de configuration.

### Ordre d'exécution (build mode)

1. Cartographie racine (`list_dir` + `rg --files | wc -l`, comptage tables/hooks/pages).
2. Lancement en parallèle des 7 sous-agents `explore` avec périmètres disjoints.
3. Lancement `dependency_scan` + `supabase--linter` en parallèle.
4. Consolidation manuelle des retours, rédaction du rapport en un seul `code--write`.
5. Mise à jour `CHANGELOG.md` + mémoire.
6. Message final court avec verdict + note /100 + lien vers le rapport.
