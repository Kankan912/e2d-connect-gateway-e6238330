
# Batch 16 : Performance, Securite RLS, Documentation

Ce plan couvre trois axes majeurs identifies apres audit complet du projet.

---

## AXE 1 : Optimisation Performance

### 1A. Cache React Query -- alertes trop frequentes

Le hook `useAlertesGlobales.ts` lance **4 requetes simultanees** avec `refetchInterval: 60000` (chaque minute). La requete `soldeCaisse` pagine potentiellement des milliers de lignes toutes les minutes. De meme, `useCaisseSynthese.ts` raffraichit toutes les 30 secondes.

**Corrections :**

| Fichier | Actuel | Propose |
|---------|--------|---------|
| `useAlertesGlobales.ts` L44 | `refetchInterval: 60000` | `refetchInterval: 5 * 60 * 1000` (5 min) |
| `useAlertesGlobales.ts` L68 | `refetchInterval: 60000` | `refetchInterval: 5 * 60 * 1000` |
| `useAlertesGlobales.ts` L114 | `refetchInterval: 60000` | `refetchInterval: 5 * 60 * 1000` |
| `useAlertesGlobales.ts` solde | Ajouter `staleTime: 2 * 60 * 1000` | Evite re-fetch si donnees fraiches |
| `useCaisseSynthese.ts` L152 | `refetchInterval: 30000` | `refetchInterval: 2 * 60 * 1000` (2 min) |

### 1B. Optimisation du calcul solde caisse

La requete `soldeCaisse` dans `useAlertesGlobales` recupere **toutes les operations** avec pagination manuelle. Remplacer par un `SUM` cote serveur via une fonction RPC ou un calcul SQL direct.

**Action :** Creer une fonction SQL `get_solde_caisse()` qui fait le calcul cote serveur et remplacer les 20 lignes de pagination par un simple `supabase.rpc('get_solde_caisse')`.

### 1C. Prefetch des donnees dashboard

Ajouter un `prefetchQuery` dans `DashboardHome` pour les donnees critiques (alertes, stats) lors du premier chargement, afin d'eviter les cascades de requetes.

---

## AXE 2 : Audit Securite RLS et Edge Functions

### CRITIQUE -- Cle API exposee publiquement

La table `configurations` stocke la valeur `resend_api_key` et a une politique RLS :
```
"Tous peuvent voir les configurations" -> SELECT -> qual: true
```
**N'importe quel utilisateur anonyme peut lire la cle API Resend.** C'est la vulnerabilite la plus grave du projet.

**Correction :**
1. Remplacer la politique `true` sur `configurations` par `auth.uid() IS NOT NULL` (authentifie seulement)
2. Creer une vue `configurations_public` (avec `security_invoker=on`) qui exclut les cles sensibles (`resend_api_key`, `smtp_password`)
3. Migrer les lectures frontend vers cette vue
4. Restreindre le SELECT sur la table de base aux admins uniquement

### Edge Function `sync-user-emails` -- Pas d'authentification

Cette fonction a `verify_jwt = false` dans `config.toml` ET ne verifie pas l'authentification dans le code. N'importe qui peut l'appeler pour declencher une synchronisation des emails.

**Correction :** Ajouter une verification d'authentification + role admin dans le code de la fonction, identique au pattern de `update-email-config`.

### Edge Functions sensibles sans JWT

Les fonctions suivantes ont `verify_jwt = false` mais verifient l'auth manuellement dans le code (ce qui est acceptable) :
- `create-user-account` -- OK (verifie auth header)
- `create-platform-user` -- OK (verifie auth + is_admin)
- `update-email-config` -- OK (verifie auth + admin)
- `donations-stats` -- OK (verifie auth + role)

Fonctions publiques legitimement sans auth (formulaires publics) :
- `process-adhesion`, `send-contact-notification`, `get-payment-config` -- OK public

Fonctions de notification (declenchees par cron/admin, pas par le public) :
- `send-email`, `send-presence-reminders`, `send-reunion-cr`, `send-cotisation-reminders`, `send-pret-echeance-reminders`, `send-sanction-notification`, `send-campaign-emails`, `send-calendrier-beneficiaires`

**Recommandation :** Pour les fonctions de notification, ajouter une verification de secret partage (header `x-cron-secret`) ou activer `verify_jwt = true`.

### Linter Supabase -- 3 avertissements

1. **OTP expiry trop long** -- A configurer dans le dashboard Supabase Auth
2. **Protection mots de passe fuites desactivee** -- A activer dans Auth > Settings
3. **Patch Postgres disponible** -- A appliquer via upgrade dans le dashboard

**Ces 3 points necessitent des actions manuelles dans le dashboard Supabase.**

### Politiques `true` sur tables de donnees

~50 tables ont des politiques SELECT avec `qual: true`. La plupart sont des tables de configuration/reference (types, config, CMS public) ou des tables sportives -- ce qui est acceptable. Cependant, les tables suivantes meritent attention :

| Table | Risque | Action |
|-------|--------|--------|
| `configurations` | **CRITIQUE** -- expose la cle API | Restreindre (voir ci-dessus) |
| `reunions_presences` | Moyen -- presences visibles par tous | Restreindre a `auth.uid() IS NOT NULL` |
| `reunions_sanctions` | Moyen -- sanctions visibles par tous | Deja protege par has_permission dans le code |
| `fichiers_joint` | Faible -- justificatifs lisibles | Restreindre a `auth.uid() IS NOT NULL` |
| `rapports_seances` | Faible -- rapports internes | Restreindre a `auth.uid() IS NOT NULL` |

---

## AXE 3 : Documentation Utilisateur

Creer un fichier `docs/GUIDE_UTILISATEUR.md` couvrant :

1. **Connexion et premiere utilisation** -- Changement de mot de passe obligatoire, navigation
2. **Tableau de bord membre** -- Consulter ses cotisations, epargnes, sanctions, presences
3. **Profil** -- Modifier ses informations personnelles
4. **Guide administrateur** -- Gestion des membres, creation de comptes, attribution de roles
5. **Reunions** -- Creer une reunion, saisir presences, cotisations, cloture
6. **Finances** -- Caisse, prets, aides, beneficiaires
7. **Sport** -- Matchs E2D/Phoenix, classements, entrainements
8. **Site web (CMS)** -- Modifier le hero, galerie, evenements, partenaires

---

## Resume des modifications

| # | Type | Fichier/Action | Priorite |
|---|------|----------------|----------|
| 1 | SECURITE | Migration SQL : politique `configurations` restrictive + vue | CRITIQUE |
| 2 | SECURITE | `sync-user-emails/index.ts` : ajout auth check | HAUTE |
| 3 | PERF | `useAlertesGlobales.ts` : reduire refetchInterval a 5 min | MOYENNE |
| 4 | PERF | `useCaisseSynthese.ts` : reduire refetchInterval a 2 min | MOYENNE |
| 5 | PERF | Migration SQL : fonction `get_solde_caisse()` | MOYENNE |
| 6 | PERF | `useAlertesGlobales.ts` : utiliser RPC au lieu de pagination | MOYENNE |
| 7 | DOC | `docs/GUIDE_UTILISATEUR.md` : guide complet | BASSE |
| 8 | SECURITE | Dashboard Supabase : OTP, leaked password, Postgres patch | HAUTE (manuel) |

## Section technique

### Migration SQL prevue

```sql
-- 1. Restreindre la table configurations
DROP POLICY IF EXISTS "Tous peuvent voir les configurations" ON configurations;
CREATE POLICY "Admins peuvent voir les configurations"
  ON configurations FOR SELECT
  USING (is_admin());

-- 2. Vue publique sans donnees sensibles
CREATE VIEW configurations_public
WITH (security_invoker=on) AS
  SELECT id, cle, valeur, description, created_at, updated_at
  FROM configurations
  WHERE cle NOT IN ('resend_api_key', 'smtp_password');

-- 3. Fonction calcul solde caisse
CREATE OR REPLACE FUNCTION get_solde_caisse()
RETURNS numeric
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
  SELECT COALESCE(
    SUM(CASE WHEN type_operation = 'entree' THEN montant ELSE -montant END),
    0
  ) FROM fond_caisse_operations;
$$;
```

### Edge function `sync-user-emails`

Ajouter les memes 15 lignes d'authentification que `update-email-config` : verification Authorization header + verification is_admin via RPC.

### Fichiers frontend a modifier

Les lectures de `configurations` dans `ClotureReunionModal.tsx`, `NotificationsAdmin.tsx`, `GestionGeneraleManager.tsx`, `EmailConfigManager.tsx` continueront de fonctionner car les utilisateurs concernes sont des admins. Aucune modification frontend n'est necessaire pour la vue.
