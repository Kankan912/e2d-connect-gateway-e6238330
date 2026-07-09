# Changelog — Refonte Avril 2026

Récapitulatif des 8 lots livrés lors de la refonte d'avril 2026.

## Lot 1 — Prêts & Caisse
- Service `pretCalculsService` unifié (intérêt direct, reconduction, prorata).
- Hook `useCaisse` + RPC `get_solde_caisse()` comme source unique de vérité.
- Solde empruntable = 80 % du fond − prêts en cours.

## Lot 2 — Sécurité RLS
- Politiques durcies via `is_admin()` et `auth.uid()`.
- Vue `configurations_public` pour exposition limitée des configurations.
- Logs d'audit obligatoires sur insertions sensibles.

## Lot 3 — Cotisations & Exercices
- Index unique partiel garantissant un seul exercice actif à la fois.
- Verrouillage : modification d'un exercice actif requiert admin + motif.
- Types filtrés via `exercices_cotisations_types.actif`.

## Lot 4 — Aides & Caisse
- Statut `alloué` déclenche automatiquement une écriture de dépense dans `fond_caisse_operations`.
- Synchronisation bidirectionnelle aide ↔ caisse.

## Lot 5 — Notifications / Emails
- `email-utils.ts` : retry exponentiel sur 3 tentatives (500, 1000, 2000 ms).
- Détection automatique des erreurs transitoires (timeout, 429, 5xx).
- Logging centralisé dans `notifications_envois`.
- 9 Edge Functions redéployées avec la nouvelle logique partagée.

## Lot 6 — Sport / Synchronisation matchs
- Nouveau trigger `trg_sync_e2d_match_to_site_event` (INSERT/UPDATE/DELETE).
- Filtre serveur strict : `statut_publication = 'publie'` et `≠ annulé`.
- Source de vérité côté serveur ; le hook frontend devient une redondance.

## Lot 7 — Galerie / Albums
- Vérification : table `site_gallery_albums` + route `/albums/:albumId` opérationnelles.
- Upload groupé fonctionnel.

## Lot 8 — Stabilité globale
- `ErrorBoundary` à 2 niveaux (App + Dashboard) avec fonction retry.
- `lazyWithRetry` appliqué à TOUS les imports dynamiques de routes.
- `vercel.json` : fallback SPA `/(.*)` → `/index.html`.

## Lot 9 — Tests unitaires (post-refonte)
- 26 tests Vitest couvrant les calculs critiques :
  - `pretCalculsService.test.ts` (11 tests).
  - `caisseCalculations.test.ts` (6 tests).
  - `cotisationsLogic.test.ts` (9 tests).
- Exécution : `bunx vitest run`.

## Lot 10 — Documentation
- Mise à jour `ARCHITECTURE.md`, `GUIDE_UTILISATEUR.md`, `IMPLEMENTATION_CHECKLIST.md`.
- Création de ce CHANGELOG.

## Lot 11 — Audit sécurité final
- Linter Supabase exécuté : 71 warnings analysés.
- Aucun ERROR critique. Tous les warnings restants sont des choix par design documentés dans la mémoire sécurité projet :
  - Buckets publics : intentionnels (photos, assets site).
  - SECURITY DEFINER exposés : nécessaires au fonctionnement RLS.
  - Auth (OTP, leaked password, version Postgres) : à régler côté dashboard Supabase.

## Refonte Juillet 2026 — Lot 1.4 — LoadingButton + formatFCFA
- Nouveau composant `LoadingButton` (`src/components/ui/loading-button.tsx`) : wrapper `Button` + `Loader2`, prop `loading` / `loadingText`.
- Migration ciblée des formulaires à forte fréquence : `CompteRenduForm`, `CotisationSaisieForm`, `E2DMatchForm`, `E2DMatchEditForm`, `ReunionForm`, `MemberForm`, `CreateUserDialog`.
- Centralisation du formatage FCFA via `formatFCFA()` (`src/lib/utils.ts`) dans 7 fichiers à forte densité : `RapportsTabsContent`, `compte-rendu-pdf`, `CompteRenduViewer`, `rapports-export`, `CotisationsCumulAnnuel`, `AidesAdmin`, `ClotureReunionModal`.
- Audit liens internes `<a href="/…">` : 0 occurrence détectée, aucun correctif nécessaire (usage systématique de `useNavigate` / `<Link>`).


## Refonte Juillet 2026 — Lot 1.5 — Multi-provider email (SMTP / Resend) — validation
- Audit de l'infrastructure email existante : le double provider est **déjà en place** et opérationnel, aucun code applicatif n'a été modifié.
- Provider actif en production : **SMTP Gmail** (`smtp.gmail.com:587`, TLS, expéditeur `zpekinho@gmail.com`) — `configurations.email_service = 'smtp'`.
- Provider Resend : conservé en réserve, sélectionnable depuis l'UI admin. Clé `resend_api_key` maintenue en base par décision utilisateur (non testée dans ce lot).
- Fallback automatique bidirectionnel disponible dans `sendEmail()` (`email-utils.ts`) : si le provider principal échoue, l'autre est tenté avec les mêmes paramètres.
- UI admin (`EmailConfigManager.tsx`) : radio de sélection provider + 3 boutons de test (`Tester SMTP`, `Tester Resend`, `Tester auto + fallback`).
- Passage à un domaine pro (futur) : purement configuration, aucun code à toucher — mettre à jour `email_expediteur` avec l'adresse du domaine vérifié dans Resend, remplacer la clé `resend_api_key`, basculer l'`email_service` sur `resend` et lancer le test.
- Note : ce projet est branché sur un Supabase externe ; les emails managés Lovable (scaffold `auth-email-hook`, DNS auto) ne sont pas disponibles ici. Le chemin Resend + domaine reste la voie officielle.


## Refonte Juillet 2026 — Phase 2.2 — Fondations Multi-Tenant (schéma DB)

Livraison de 7 migrations SQL préparant l'isolation stricte par association. Aucune règle d'accès (RLS) n'a encore été refondue — c'est l'objet de la Phase 2.4. Le frontend continue de fonctionner à l'identique (contexte tenant implicite via fonction `default_association_id()`).

**Modifications de schéma :**
- **`associations` enrichie** : `slug` (unique), `logo_url`, `theme_tokens`, `email_config`, `caisse_config`, `locale`, `feature_flags`, `statut`, `updated_at`.
- **2ème tenant créé** : association `Phoenix` (slug `phoenix`) pour préparer l'isolation des données de la section sportive Phoenix.
- **60 tables** reçoivent une colonne `association_id NOT NULL` (backfill vers E2D ou Phoenix, index créé, valeur par défaut = association de l'utilisateur courant).
- **26 tables déjà porteuses** passent en `NOT NULL` avec DEFAULT sur `public.default_association_id()`.
- **Historique / notifications / audit** (`email_logs`, `notifications_*`, `audit_logs`) : `association_id` **nullable** (NULL = envoi ou action plateforme).
- **Rôles hybrides** : ajout de `roles.scope` (`platform` | `association`) et `roles.is_system`. Les rôles socles (`super_admin`, `administrateur`, `membre`) sont classés `platform` + `is_system`. Nouveau rôle `super_admin` créé. `user_roles.association_id` peut être NULL uniquement pour un rôle plateforme (garanti par trigger `validate_user_role_scope`).
- **Scission `configurations`** : nouvelles tables `platform_settings` (globale) et `association_settings` (par asso). Les 39 clés existantes ont été copiées dans `association_settings` pour E2D. La table `configurations` d'origine est conservée en lecture/écriture jusqu'à la Phase 4 (bascule du code). Vue de compatibilité `configurations_v_compat` créée.
- **4 fonctions helpers RLS créées** (non branchées cette phase) : `is_super_admin()`, `get_user_associations()`, `has_association_access()`, `is_admin_of()`.

**Fichier de suivi** : `docs/PHASE2_TENANT_AUDIT.md`.

