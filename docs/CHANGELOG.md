# Changelog — Refonte Avril 2026

Récapitulatif des 8 lots livrés lors de la refonte d'avril 2026.

## Audit complet — Juillet 2026
- Rapport consolidé : **`docs/AUDIT_COMPLET_2026_07.md`** (20 étapes, 30 correctifs priorisés).
- Note globale initiale : **72/100**. 3 correctifs P0 (Edge Functions publiques + DELETE caisse hors service).
- **Lot 1 (P0)** : `send-contact-notification` (rate-limit + validation), `process-adhesion` (auth webhook), RPC `reverse_caisse_movement` remplace les DELETE directs, whitelist `useAides`.
- **Lot 2 (CI + sécurité web)** : pipeline `.github/workflows/ci.yml` (lint, typecheck, tests, build, CodeQL, Semgrep, Gitleaks), `vercel.json` (CSP/HSTS/X-Frame-Options), `_shared/cors.ts` (CORS restrictif), dépendances de test déplacées en devDependencies.
- **Lot 3 (métier P1 — livré partiellement)** : `useAlertesGlobales` utilise `LoanService.resolveStatus` + `calculerResumePret`. `BeneficiaireService.calculerDistribution()` prorata temporis (montant × jours) avec tests. Nouveau hook `useCurrencyFormatter` (fondation devise multi-tenant). `useUtilisateurs` parallélise 3 requêtes via `Promise.all`.
- **Lot 4 (qualité — livré partiellement)** : nouveau `supabase/functions/_shared/schemas.ts` (Zod partagé + helper `parseBody`).
- **Lot 5 (perf — livré partiellement)** : `vite.config.ts` `manualChunks` (react, radix, recharts, jspdf, supabase, react-query), route catch-all Dashboard avec `DashboardNotFound`.
- **Lot 3-5 (compléments)** : Sentry initialisation conditionnelle (no-op sans `VITE_SENTRY_DSN`), hook `useCotisationsTypesForExercice` (filtre `exercices_cotisations_types.actif`), suppression code mort (`Breadcrumbs.tsx`, `MediaLibrary.tsx`, `PretsAlertes.tsx`), suppression `useCotisationsTypes` non utilisé remplacé par variante filtrée.
- Suite Lots 3-5 (codemod formatage devise ~30 fichiers, migration CORS 20 Edge Functions, `strictNullChecks`, refactor gros composants, retrait bypass admin front) : planifiée par PR incrémentales validées par le nouveau pipeline CI.



## Phase 6 — i18n & Thèmes par association (Juillet 2026)
- **Infrastructure i18n** : `i18next` + `react-i18next` + détection navigateur/localStorage.
  Namespaces : `common`, `finance`, `admin`, `site`. Langues : FR (défaut), EN.
- **`<LanguageSwitcher />`** ajouté dans le header dashboard.
- **Thème par association** : nouvelle page `/dashboard/admin/branding`
  (`AssociationBrandingAdmin`) éditant `associations.theme_tokens` (couleurs
  HSL, radius, devise, locale) et `logo_url`. Aucune nouvelle table SQL —
  réutilisation du contexte tenant existant qui applique déjà `--tenant-*`.
- **Devise dynamique** : helper `formatCurrencyForAssociation()` lit
  `currency_code` depuis les tokens (fallback FCFA, XOF traité comme FCFA).
- **Docs** : `docs/I18N_THEMING.md`, mémoire `mem://architecture/i18n-theming`.
- **Tests Vitest** : `src/i18n/i18n.test.ts`, `src/lib/formatCurrencyDynamic.test.ts`.



## Phase 5 — Cohérence métier Prêts / Aides / Bénéficiaires (Juillet 2026)
- **Statuts prêts unifiés** : `LoanService.resolveStatus` + `<StatutBadge>` + `useLoanStatus`.
  `PretsAdmin` délègue au service domaine (plus de switch dupliqué).
- **Workflow Aides verrouillé** : `AideService.advanceWorkflow` valide les
  transitions (`demandee → validee → allouee → payee`) et remonte les
  `DomainError` en toast via `useAdvanceAideWorkflow`.
- **Reconductions** : `ReconductionsAttenteList` affiche capital + intérêt
  prorata et confirme via `AlertDialog` (jamais `window.confirm`).
- **Bénéficiaires** : source unique confirmée (`BeneficiaireService.computeMontantAnnuelNet`).
- **Solde empruntable** : plus aucun recompute client, source RPC uniquement.
- **Tests** : 6 tests Vitest sur `AideService`.
- **Docs** : `docs/AUDIT_PHASE5_METIER.md`, `mem://modules/phase5-coherence-metier`.



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


## Refonte Juillet 2026 — Phase 2.4 — Refonte RLS tenant-aware

Livraison de 8 migrations SQL branchant l'isolation stricte par association sur l'ensemble des tables métier via les helpers `has_association_access`, `is_admin_of` et `is_super_admin`. Aucune donnée n'a été modifiée.

**Helpers ajoutés :**
- `current_association_id()` : première association de l'utilisateur, fallback E2D.
- `can_view_profile(profile_id)` : lecture croisée d'un profil autorisée si le viewer partage une association avec lui.
- `_apply_tenant_rls(table, admin_write, public_select, cond)` : fonction interne (invoquée par les migrations) qui drop toutes les policies existantes et re-crée le patron standard tenant-aware.

**Lots livrés :**
- **2.4.1 — Cœur membres & auth** : `membres`, `profiles`, `user_roles`, `membres_roles`, `roles` (scope-aware), `role_permissions`.
- **2.4.2 — Finance & caisse** : 17 tables (aides, cotisations, prêts, donations, épargnes, caisse, bénéficiaires) + 5 enfants (`cotisations_membres`, audits).
- **2.4.3 — Adhésions & réunions** : 7 tables + INSERT public conservé sur `adhesions` et `demandes_adhesion`.
- **2.4.4 — Sport E2D & Phoenix** : 13 tables publiques (matchs, compositions, stats) + 8 tables internes (dépenses/recettes/adhérents Phoenix).
- **2.4.5 — Configuration & exercices** : 15 tables tenant + `platform_settings` (super_admin only) + 3 configs globales (`loan_validation_config`, `pret_reconduction_validation_config`, `configurations`) en lecture auth / écriture admin.
- **2.4.6 — CMS & site public** : 14 tables `site_*`/`cms_*` (lecture publique, écriture admin) + `messages_contact` (INSERT public conservé) + `site_pageviews`.
- **2.4.7 — Audit, notifications & logs** : `notifications` (own + admin), 8 tables tenant + audit_logs/email_logs (admin_of ou super_admin si NULL) + tables user_id (`historique_connexion`, `utilisateurs_actions_log`, `permissions_audit`) + `security_scans` (super_admin).

**Impact utilisateur E2D** : nul. La fonction `default_association_id()` continue d'injecter E2D par défaut, `has_association_access` et `is_admin_of` reconnaissent l'appartenance historique via `membres.association_id`.

**Reste avant Phase 2.5 (frontend)** : les tables `session_config`, `configurations` legacy et quelques audits restent en accès "authenticated large" pour compatibilité — elles seront affinées au moment du switch d'association côté client.


## Refonte Juillet 2026 — Phase 2.5 — Frontend Multi-Tenant

Le frontend devient conscient du tenant sans changer l'expérience E2D actuelle.

**Nouveaux fichiers :**
- `src/stores/associationStore.ts` — singleton hors React exposant l'association courante (`get/set/subscribe`).
- `src/lib/tenantQuery.ts` — helpers `getCurrentAssociationId()`, `withCurrentAssociation(payload)`, `withCurrentAssociationMany([])` pour injecter `association_id` sur les nouveaux inserts.
- `src/contexts/AssociationContext.tsx` — provider React qui charge la liste des associations accessibles (toutes pour `super_admin`, celles liées via `membres` sinon), gère la sélection persistée dans `localStorage`, applique les `theme_tokens` en variables CSS `--tenant-*`, et invalide le cache React Query lors d'un switch.
- `src/components/AssociationSwitcher.tsx` — sélecteur affiché uniquement quand l'utilisateur a accès à ≥ 2 associations.

**Modifications :**
- `src/App.tsx` : `AssociationProvider` monté à l'intérieur de `AuthProvider`, autour des routes.
- `src/components/layout/DashboardHeader.tsx` : intégration du switcher à côté du centre de notifications.

**Impact utilisateur E2D** : aucun (une seule association visible → switcher masqué, `default_association_id()` continue de couvrir les inserts existants).

**Reste avant Phase 2.6** : bouton "Créer une association" côté super-admin + edge function `provision-association` qui initialise `associations` + `association_settings` + rôles par défaut.


## Refonte Juillet 2026 — Phase 2.6 — Provisioning multi-tenant

Console super-admin permettant de créer un tenant complet en une seule action.

**Nouveaux fichiers :**
- `supabase/functions/provision-association/index.ts` — edge function gardée par `is_super_admin()` : valide le payload (Zod, slug `^[a-z][a-z0-9-]{1,30}[a-z0-9]$`), crée l'association, clone les rôles système (`administrateur`, `membre`, `tresorier`, `secretaire_general`) au scope association, provisionne l'utilisateur admin (ou réutilise s'il existe), crée le `membre` lié et assigne le rôle `administrateur`, puis insère les settings par défaut. Renvoie le mot de passe généré une seule fois.
- `src/components/auth/SuperAdminRoute.tsx` — garde de route réservée à `userRole === 'super_admin'`.
- `src/pages/admin/platform/AssociationsPlatformAdmin.tsx` — liste des associations + dialog "Nouvelle association" avec affichage sécurisé du mot de passe temporaire (copie clipboard, disparaît à la fermeture).

**Modifications :**
- `src/pages/Dashboard.tsx` : route `/admin/platform/associations` derrière `SuperAdminRoute`.
- `src/components/layout/DashboardSidebar.tsx` : groupe « Plateforme » affiché uniquement aux super-admins.
- `supabase/config.toml` : enregistrement de `provision-association` avec `verify_jwt = true`.

**Impact utilisateur E2D** : aucun changement fonctionnel. Le groupe « Plateforme » est invisible pour les utilisateurs standards. La Phase 2 est désormais complète : le noyau multi-tenant (schéma + RLS + frontend + provisioning) est en place.



## Refonte Juillet 2026 — Phase 3 — RBAC granulaire par tenant & audit unifié

Les permissions et l'audit deviennent conscients du tenant courant, sans changer l'expérience E2D.

**Migration SQL :**
- `public.current_tenant_id()` — retourne le tenant courant : lit la GUC `app.current_association_id`, fallback sur `default_association_id()` (association du membre lié → 1er `user_roles.association_id` → E2D).
- `public.has_permission(resource_name, perm)` réécrite (même signature) : court-circuits `is_super_admin()` puis rôle plateforme `administrateur`, sinon vérification granulaire dans `role_permissions` filtrée sur `ur.association_id IS NULL OR ur.association_id = current_tenant_id()`.
- `public.has_permission_in(_association_id, _resource, _permission)` — variante explicite pour vérifier une permission dans un tenant précis (utilisée en edge / RPC).
- Backfill : pour chaque rôle `scope='association'` sans permissions, copie des `role_permissions` du rôle plateforme homonyme.
- Trigger `trg_audit_logs_fill_association` (BEFORE INSERT) : renseigne `association_id` avec `current_tenant_id()` si NULL.
- `public.log_audit(_action, _table, _row_id, _details)` — helper SECURITY DEFINER inséré dans `audit_logs` avec `auth.uid()` + tenant courant.
- `public.set_current_association(_association_id)` — RPC : vérifie l'accès via `is_super_admin() OR has_association_access(_id)`, pose la GUC via `set_config('app.current_association_id', ..., false)`.

**Edge function `provision-association` :**
- Après clonage des rôles, clone aussi leurs `role_permissions` depuis les templates plateforme (`administrateur`, `membre`, `tresorier`, `secretaire_general`). L'admin d'un nouveau tenant a immédiatement le set de permissions complet.

**Frontend :**
- `src/hooks/useRoles.ts` — la query `roles` retourne désormais aussi `scope` et `association_id`.
- `src/contexts/AssociationContext.tsx` — `syncTenantOnDb()` appelle `supabase.rpc('set_current_association')` au chargement initial et à chaque `switchAssociation()`, avant l'`invalidateQueries` pour que le cache React Query se remplisse déjà avec le bon tenant côté RLS.
- `src/pages/admin/PermissionsAdmin.tsx` — filtre `<Select>` affiché quand ≥ 2 associations sont accessibles. Les rôles `scope='platform'` restent toujours visibles ; les rôles `scope='association'` sont filtrés sur le tenant sélectionné. `super_admin` gagne également l'accès admin à cette page.

**Impact utilisateur E2D** : aucun. Une seule association visible → filtre masqué, GUC vide → `default_association_id()` renvoie E2D, `has_permission()` retourne exactement les mêmes résultats qu'avant.



## Refonte Juillet 2026 — Phase 4.1 & 4.2 — Cartographie finance & FinancialEngine (SQL)

Démarrage du chantier Domain Services. Deux livrables : la carte du domaine financier, et les deux premières briques serveur du moteur unifié.

**Documentation :**
- `docs/FINANCE_DOMAIN_MAP.md` — inventaire complet : table de vérité `fond_caisse_operations`, 21 triggers producteurs de mouvements, écritures directes frontend (`useCaisse`, `useDonations`, `process-adhesion`), RPC de lecture (`get_solde_caisse`, `get_caisse_synthese`, `get_caisse_stats`), 6 services domaine à extraire, 6 gaps identifiés (doubles sources, absence d'idempotence, `association_id` non forcé, solde empruntable client-side, pas de matérialisation, métadonnées éparses).

**Migration SQL :**
- `public.record_caisse_movement(p_type, p_montant, p_categorie, p_libelle, p_source_table, p_source_id, p_beneficiaire_id, p_reunion_id, p_exercice_id, p_date_operation, p_notes, p_justificatif_url)` — point d'entrée unique pour toute écriture caisse. Valide `type ∈ {entree, sortie}` et `montant > 0`, exige `auth.uid()`, résout `association_id` via `current_tenant_id()` (fallback `default_association_id()`), garantit l'idempotence sur `(source_table, source_id, type_operation, categorie, association_id)` — un rejeu de trigger ou un double INSERT renvoie l'UUID existant sans doublon.
- `public.get_solde_empruntable(p_association_id, p_pourcentage)` — porte la règle des 80 % côté serveur : `max(0, floor(fond × %/100) − prêts_en_cours)`. Cohérence garantie entre dashboard, workflow de validation des prêts et edge functions.
- `GRANT EXECUTE` sur les deux fonctions pour `authenticated` et `service_role`.

**Compatibilité :**
- Aucun trigger existant n'est modifié ni supprimé. La migration progressive des producteurs (hooks + triggers) vers `record_caisse_movement` est planifiée en Phase 4.4.
- Le calcul client `calcSoldeEmpruntable` (`src/lib/caisseCalculations.test.ts`) reste valide en tant que fallback ; les hooks basculeront sur la RPC en 4.4.

**Impact utilisateur E2D** : aucun changement fonctionnel. Deux nouvelles fonctions serveur disponibles, aucune modification de table, aucun trigger touché.

## Refonte Juillet 2026 — Phase 4.4 (partiel) — Bascule `useCaisse` vers `CaisseService`

Première étape de migration des producteurs frontend vers le FinancialEngine.

**Frontend :**
- `useCreateCaisseOperation` : l'INSERT direct dans `fond_caisse_operations` est remplacé par un appel à `CaisseService.recordMovement()` (RPC `record_caisse_movement`). Bénéfices : idempotence serveur, `association_id` forcé par `current_tenant_id()`, validation stricte du type et du montant.
- `createCaisseOperationFromModule` (utilitaire cross-module) : idem — délègue à `CaisseService`. Le paramètre `operateur_id` devient inutilisé (l'operateur est déduit de `auth.uid()` côté serveur) mais reste dans la signature pour compat.
- `src/domain/finance/types.ts` : `CaisseCategorie` élargi (`pret_decaissement`, `distribution_beneficiaire`, `interet`, `sport`, plus tolérance string libre) pour couvrir les libellés déjà en base sans mapping forcé.

**Compatibilité :**
- Aucun trigger SQL modifié.
- Les lectures (`useCaisseOperations`, `useCaisseStats`, `useCaisseDetails`, `useCaisseSynthese`, `useDeleteCaisseOperation`) restent inchangées — Phase 4.4 se limite pour l'instant aux **écritures**.
- Les hooks `useDonations`, `useAides`, `useEpargnes`, `usePrets`, `useCotisations` continuent de reposer sur les triggers SQL existants (bascule progressive au fil des sous-étapes 4.4.x).

**Impact utilisateur E2D** : aucun changement fonctionnel visible ; les opérations manuelles de caisse sont désormais idempotentes et tenant-safe.

## Refonte Juillet 2026 — Phase 4.5 — Instantané matérialisé `caisse_soldes_snapshot`

**Objectif** : éviter les agrégations lourdes sur `fond_caisse_operations` (déjà 5 000+ lignes et croissant) à chaque affichage de tableau de bord.

**Livrables** :
- Vue matérialisée `public.caisse_soldes_snapshot` (agrégats par `association_id` : total entrées, total sorties, solde net, nb opérations, dernière opération, `refreshed_at`).
- Index unique sur `association_id` (permet le `REFRESH CONCURRENTLY` non bloquant).
- RPC `refresh_caisse_soldes_snapshot()` (fallback `REFRESH` classique à la première exécution).
- RPC lecture `get_caisse_solde_snapshot(p_association_id)` — sécurisée (auth requise), résout automatiquement le tenant courant si aucun paramètre.
- Accès direct API révoqué pour `authenticated` (recommandation linter Supabase : les MV ne doivent pas fuiter via PostgREST).
- Adaptateur TS : `CaisseService.getSoldeSnapshot()` + `CaisseService.refreshSnapshot()`.

**Rétro-compatibilité** :
- Aucun trigger ni RPC existant modifié. `get_solde_caisse()` reste la source temps-réel pour les vues critiques (dépôt/retrait immédiat) ; l'instantané est destiné aux dashboards et rapports où une latence de rafraîchissement est acceptable.

**Impact utilisateur E2D** : aucun changement visible pour l'instant. Le service est disponible côté frontend ; les dashboards seront bascullés dans la sous-étape 4.4 restante.

---

## Refonte Juillet 2026 — Phase 4.4 & 4.6 — Finalisation FinancialEngine

**Objectif** : faire de `record_caisse_movement` l'unique voie d'écriture dans `fond_caisse_operations`, côté frontend comme côté triggers SQL, et livrer la documentation associée.

**Livrables 4.4** :
- `record_caisse_movement` étendue d'un paramètre `p_operateur_id` (opérateur explicite prioritaire sur `auth.uid()`), et rendue utilisable par les triggers `SECURITY DEFINER` (auth optionnelle, fallback historique sur le premier membre).
- Triggers SQL réécrits pour déléguer à la RPC (comportement observable identique, idempotence garantie sur `(source_table, source_id, type, categorie, association)`) :
  - `create_caisse_operation_from_source` (cotisations, épargnes, prêts, remboursements, aides)
  - `sync_sanction_to_caisse`
  - `sync_reunion_beneficiaire_to_caisse`
- Nouveau hook `useCaisseSoldeSnapshot()` (lecture rapide de la MV `caisse_soldes_snapshot`).
- `useCreateCaisseOperation` déclenche un `CaisseService.refreshSnapshot()` best-effort après chaque écriture réussie et invalide la query `caisse-solde-snapshot`.

**Livrables 4.6** :
- Tests Vitest `src/domain/finance/CaisseService.test.ts` : validations, mapping des paramètres RPC, gestion snapshot vide, propagation des erreurs.
- Documentation `docs/FINANCIAL_ENGINE.md` : architecture cible, contrats des RPC, matrice producteurs → catégorie, guide de migration pour nouveaux modules.
- Mémoire projet `mem://architecture/finance/financial-engine` (règle : toute écriture caisse passe par `CaisseService.recordMovement`).

**Rétro-compatibilité** :
- Aucun changement de schéma de table.
- Signature de `record_caisse_movement` étendue (nouveau paramètre optionnel en fin) ; tous les appels existants continuent de fonctionner.
- `get_solde_caisse()`, `get_caisse_stats()`, `get_caisse_synthese()` inchangés.
- Aucun changement UI / UX pour les utilisateurs E2D.




