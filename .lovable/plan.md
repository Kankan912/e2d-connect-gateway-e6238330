# Plan : Suppression auto-inscription + Dashboard de monitoring admin

## 1. Suppression de l'option "Créer un compte" (page Auth)

**Fichier** : `src/pages/Auth.tsx`

- Supprimer toute la logique `showSignUp`, `handleSignUp`, le formulaire d'inscription et les states associés (`signUpEmail`, `signUpPassword`, `signUpNom`, `signUpPrenom`, `signUpTelephone`).
- Remplacer le lien "Pas encore membre ? Créer un compte" par un message informatif :
  > *"Les comptes sont créés par l'administrateur. Contactez-le pour obtenir vos identifiants."*
- Conserver uniquement le formulaire de connexion et le bouton "Retour au site".

**Sécurité backend (Supabase Dashboard)** :
- Documenter dans `docs/SECURITY_DASHBOARD_ACTIONS.md` la nécessité de **désactiver les inscriptions publiques** dans Supabase Auth (`Authentication → Providers → Email → Disable "Allow new users to sign up"`). Sans cela, un utilisateur technique pourrait toujours appeler `supabase.auth.signUp` directement.

## 2. Dashboard Admin "Monitoring & Audit"

### Infrastructure existante (réutilisée)
Les tables sont déjà en place :
- `historique_connexion` (user_id, date_connexion, ip_address, user_agent, statut) — **12 lignes existantes**
- `utilisateurs_actions_log` (user_id, action, old_value, new_value, performed_by, performed_at, details)
- `audit_logs` (action, table_name, record_id, user_id, old_data, new_data, ip_address, user_agent)

### A. Hook de tracking automatique des connexions
**Nouveau** : `src/hooks/useConnectionTracker.ts`
- Écoute `onAuthStateChange` dans `AuthContext` 
- Sur `SIGNED_IN` : insertion d'une ligne dans `historique_connexion` avec user_agent et statut='succes'
- Sur erreur de connexion (depuis `Auth.tsx`) : log `statut='echec'`

### B. Hook de tracking pageviews (statistiques de consultation)
**Nouvelle table** : `site_pageviews` (id, path, user_id nullable, session_id, referrer, user_agent, created_at)
- RLS : INSERT public (pour visiteurs anonymes), SELECT admin only
- **Nouveau hook** `src/hooks/usePageviewTracker.ts` branché dans `App.tsx` qui log chaque changement de route via `useLocation`
- Throttling : éviter doublons sur la même page < 5s

### C. Nouvelle page admin `/admin/monitoring`
**Fichier** : `src/pages/admin/MonitoringAdmin.tsx`

Structure en onglets (Tabs) :

1. **Statistiques consultation site**
   - Cards : visites aujourd'hui / 7j / 30j, visiteurs uniques, pages les plus vues
   - Graphique LineChart (Recharts) : visites quotidiennes sur 30j
   - Top 10 pages (BarChart)
   - Répartition membres connectés vs visiteurs anonymes

2. **Historique connexions membres**
   - Table paginée : Membre, date, IP, navigateur, statut (succès/échec)
   - Filtres : par utilisateur, période, statut
   - Stats : connexions du jour, échecs récents (alerte sécurité)
   - Export CSV

3. **Logs d'actions / éditions**
   - Vue unifiée combinant `audit_logs` + `utilisateurs_actions_log`
   - Colonnes : Date, Utilisateur, Action, Table/Ressource, Détails (modal pour voir old/new data)
   - Filtres : par utilisateur, table, action (insert/update/delete), période
   - Export CSV

### D. Routing & navigation
- Ajouter route `/admin/monitoring` dans `App.tsx` (lazyWithRetry, protégée par `PermissionRoute resource="utilisateurs" permission="admin"`)
- Ajouter entrée dans `DashboardSidebar.tsx` (section Administration) avec icône `Activity` ou `BarChart3`

## 3. Détails techniques

### Migration SQL
```sql
-- Table pageviews
CREATE TABLE public.site_pageviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  path text NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id text,
  referrer text,
  user_agent text,
  ip_address inet,
  created_at timestamptz DEFAULT now()
);
CREATE INDEX idx_pageviews_created ON site_pageviews(created_at DESC);
CREATE INDEX idx_pageviews_path ON site_pageviews(path);
ALTER TABLE site_pageviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public_insert_pageviews" ON site_pageviews 
  FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "admin_select_pageviews" ON site_pageviews 
  FOR SELECT TO authenticated USING (is_admin());
```

### Vérifier RLS existante
Confirmer que `historique_connexion` et `audit_logs` ont déjà des policies SELECT admin — sinon les ajouter dans la même migration.

### Logger automatique d'actions
Vérifier l'existence de triggers d'audit sur les tables critiques (`membres`, `cotisations`, `prets`, `fond_caisse_operations`). Si absents, ajouter des triggers génériques d'audit qui insèrent dans `audit_logs` sur INSERT/UPDATE/DELETE.

## 4. Livrables

| Fichier | Action |
|---|---|
| `src/pages/Auth.tsx` | Modifié — suppression sign-up |
| `src/pages/admin/MonitoringAdmin.tsx` | Créé |
| `src/hooks/useConnectionTracker.ts` | Créé |
| `src/hooks/usePageviewTracker.ts` | Créé |
| `src/contexts/AuthContext.tsx` | Modifié — branche tracker |
| `src/App.tsx` | Modifié — route + pageview tracker |
| `src/components/layout/DashboardSidebar.tsx` | Modifié — entrée menu |
| `supabase/migrations/...sql` | Créé — table pageviews + RLS + triggers audit |
| `docs/SECURITY_DASHBOARD_ACTIONS.md` | Modifié — désactiver signup |

Confirme avec **"go"** pour exécuter ce plan.
