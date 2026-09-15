# Rapport d'audit — Lots 3 et 4 (audit du 14 septembre 2026)

Format imposé : `ID | Fichiers modifiés | Migration SQL | Tests exécutés | Résultat | Statut | Risque résiduel`

## Lot 3 — Règles métier et fiabilité

**A18 — Suivi des présences par exercice (et non par année civile)**
`src/components/PresencesRecapAnnuel.tsx` | aucune | `bunx tsgo --noEmit`, `bunx vitest run`, `bun run build` | Le bilan se base désormais sur l'exercice sélectionné (`date_debut`–`date_fin`), l'exercice `actif` étant choisi par défaut ; le sélecteur liste les exercices par nom, l'export et le message « aucune donnée » suivent l'exercice | **Fait** | Les exercices à cheval sur deux années nécessitent des dates de début/fin correctement saisies.

**A19 — Clôture de réunion transactionnelle**
`src/components/reunions/cloture/useClotureReunion.ts` | RPC `public.cloturer_reunion(uuid)` + index unique partiel `reunions_sanctions_auto_unique` | idem | Absences, sanctions (absence + Huile & Savon), taux de présence et passage en `terminee` sont appliqués d'un seul bloc côté base, avec contrôle d'association et de rôle ; l'appel est idempotent (`deja_cloturee`) et journalisé. L'envoi du compte rendu a lieu après succès et n'annule jamais la clôture | **Fait** | L'envoi d'email reste hors transaction (choix assumé : un échec d'email ne doit pas annuler la clôture).

**A20 — Réouverture de réunion transactionnelle**
`src/components/ReouvrirReunionModal.tsx` | RPC `public.rouvrir_reunion(uuid, boolean, text)` | idem | Statut, déverrouillage des cotisations, annulation des écritures de caisse (`reverse_caisse_movement`), suppression optionnelle des sanctions impayées et audit sont appliqués d'un bloc, réservés aux administrateurs de l'association, idempotents (`deja_ouverte`) | **Fait** | L'annulation d'une écriture de caisse déjà annulée est ignorée sans erreur ; à surveiller via le journal d'audit.

## Lot 4 — Durcissement

**A27 — Supervision des erreurs**
`package.json`, `bun.lock`, `src/lib/sentry.ts`, `.env.example` | aucune | `bun run build` | `@sentry/react` (10.74) est installé et réellement branché ; l'initialisation n'a lieu que si `VITE_SENTRY_DSN` est renseigné, sans évaluation de code (compatible CSP sans `unsafe-eval`) | **Fait** | Le DSN doit être fourni en production pour que la supervision soit effective.

**A25 — Tests d'isolation RLS exécutables**
`src/test/security/rls-anon.test.ts`, `.env.example` | aucune | `bunx vitest run` → 151 tests passés, 41 ignorés | Nouvelle suite exécutable sans secret : 15 tables (enfants durcies au lot 1 + tables métier) vérifiées comme illisibles sans connexion, plus le refus des RPC `cloturer_reunion`/`rouvrir_reunion` pour un visiteur. La suite authentifiée A/B (`rls.test.ts`, 41 tests) reste ignorée tant que les 4 variables `VITE_TEST_*` ne sont pas fournies ; elles sont documentées dans `.env.example` | **Fait (partiel documenté)** | Les scénarios croisés membre/admin nécessitent des comptes de test dédiés côté CI.

**A21 — Typage des flux sensibles**
`src/components/reunions/cloture/useClotureReunion.ts` | aucune | `bunx tsgo --noEmit` → 0 erreur | Suppression de `eslint-disable no-explicit-any` et des 10 `any` du flux de clôture, remplacés par les types `MembreLite`, `PresenceJointe`, `BeneficiaireRow`, `PointCR` et les aides `nomComplet`/`nomsDepuisPresences` | **Fait** | D'autres modules conservent des `any` non critiques.

**A22 — Typage de `types.ts`** — hors périmètre : fichier généré par Supabase.

## Validation globale

- `bunx tsgo --noEmit -p tsconfig.app.json` : 0 erreur
- `bunx vitest run` : 17 fichiers, 151 tests passés, 41 ignorés (comptes de test absents)
- `bun run build` : succès

## Alertes du linter Supabase (état hérité)

Le linter retourne 209 alertes, **identiques avant et après** les migrations de ce lot :

- 100 fonctions `SECURITY DEFINER` exécutables sans connexion et 107 exécutables par un utilisateur connecté — héritées du socle historique. Les deux nouvelles RPC ont été explicitement retirées de `PUBLIC`/`anon` et réservées à `authenticated` ; elles ne figurent donc pas parmi les alertes « anonyme ».
- 1 table avec RLS activée sans policy et 1 alerte « protection des mots de passe compromis désactivée » — cette dernière s'active dans la console Supabase (Authentication → Policies) et relève d'une action côté propriétaire du projet.

Une revue exhaustive des droits d'exécution des ~200 fonctions historiques constitue un chantier à part, à planifier hors de ce lot.
