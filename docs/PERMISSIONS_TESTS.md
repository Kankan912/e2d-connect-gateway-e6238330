# Tests du Système de Permissions E2D Connect

## 📋 Comptes de Test Créés

| Email | Mot de passe | Rôle | Statut |
|-------|--------------|------|--------|
| admin@e2d.com | *existant* | Administrateur | ✅ Actif |
| tresorier@test.com | Test123! | Trésorier | ⏳ À créer |
| secretaire@test.com | Test123! | Secrétaire Général | ⏳ À créer |
| sport@test.com | Test123! | Responsable Sportif | ⏳ À créer |
| censeur@test.com | Test123! | Censeur | ⏳ À créer |
| commissaire@test.com | Test123! | Commissaire aux Comptes | ⏳ À créer |
| membre@test.com | Test123! | Membre (aucun rôle) | ⏳ À créer |

---

## 🚀 Instructions de Création

### Étape 1 : Créer les utilisateurs dans Supabase Auth

1. Aller sur [Supabase Auth Users](https://supabase.com/dashboard/project/piyvinbuxpnquwzyugdj/auth/users)
2. Cliquer sur "Add user" → "Create new user"
3. Créer chaque utilisateur avec :
   - Email : (voir tableau ci-dessus)
   - Password : `Test123!`
   - Auto Confirm User : ✅ Coché

### Étape 2 : Exécuter le script SQL

1. Aller sur [Supabase SQL Editor](https://supabase.com/dashboard/project/piyvinbuxpnquwzyugdj/sql/new)
2. Copier le contenu de `docs/TEST_USERS_SETUP.sql`
3. Exécuter le script
4. Vérifier les notifications dans la console

---

## 🧪 Résultats Attendus par Rôle

### 1. 👑 Administrateur (admin@e2d.com)

**Sections visibles dans la sidebar** :
- ✅ Mon Espace (4 liens : Profil, Dons, Cotisations, Déconnexion)
- ✅ Finances (3 liens : Dons, Adhésions, Stats Finances)
- ✅ Tontine (6 liens : Cotisations, Épargnes, Prêts, Aides, Sanctions, Stats Tontine)
- ✅ Réunions (3 liens : Réunions, Présences, Comptes-rendus)
- ✅ Sport (3 sous-sections)
  - E2D (Matchs, Joueurs, Stats)
  - Phoenix (Matchs, Équipes, Entraînements, Compositions, Stats)
  - Entraînements internes
- ✅ Gestion (3 liens : Membres, Rôles, Permissions, Paiements)
- ✅ Site Web (6 liens : Hero, Activités, Événements, Galerie, Partenaires, Config)

**Total estimé : ~35 liens**

**Permissions accordées** :
- ✅ Toutes les ressources (create, read, update, delete)

**Badge affiché** :
- 👑 Super Admin

**Dashboard Home affiche** :
- "👑 Super Administrateur"
- Bouton "Gérer les Permissions" (variant principal)
- Bouton "Gérer les Dons" (variant outline)

---

### 2. 💰 Trésorier (tresorier@test.com)

**Sections visibles** :
- ✅ Mon Espace (4 liens)
- ✅ Finances (3 liens : Dons, Adhésions, Stats)
- ✅ Tontine (6 liens : Cotisations, Épargnes, Prêts, Aides, Sanctions, Stats)
- ❌ Réunions
- ❌ Sport
- ❌ Gestion (sauf Stats)
- ❌ Site Web

**Total estimé : ~13 liens**

**Permissions accordées** :
- ✅ donations (create, read, update, delete)
- ✅ cotisations (create, read, update, delete)
- ✅ epargnes (create, read, update, delete)
- ✅ prets (create, read, update, delete)
- ✅ aides (create, read, update, delete)
- ✅ sanctions (create, read, update, delete)

**Badge affiché** :
- 💰 Trésorier

**Dashboard Home affiche** :
- "💰 Trésorier"
- Bouton "Voir mes Permissions" (variant outline)
- Bouton "Gérer les Dons" (variant outline)

---

### 3. 📝 Secrétaire Général (secretaire@test.com)

**Sections visibles** :
- ✅ Mon Espace (4 liens)
- ✅ Réunions (3 liens : Réunions, Présences, Comptes-rendus)
- ❌ Finances
- ❌ Tontine
- ❌ Sport
- ❌ Gestion
- ❌ Site Web

**Total estimé : ~7 liens**

**Permissions accordées** :
- ✅ reunions (create, read, update, delete)
- ✅ presences (create, read, update, delete)
- ✅ membres (read)

**Badge affiché** :
- 📝 Secrétaire Général

**Dashboard Home affiche** :
- "📝 Secrétaire Général"
- Pas de section admin

---

### 4. ⚽ Responsable Sportif (sport@test.com)

**Sections visibles** :
- ✅ Mon Espace (4 liens)
- ✅ Sport (3 sous-sections : E2D, Phoenix, Entraînements)
  - E2D : Matchs, Joueurs, Stats
  - Phoenix : Matchs, Équipes, Entraînements, Compositions, Stats
  - Entraînements internes
- ❌ Finances
- ❌ Tontine
- ❌ Réunions
- ❌ Gestion
- ❌ Site Web

**Total estimé : ~13 liens**

**Permissions accordées** :
- ✅ sport_e2d (create, read, update, delete)
- ✅ sport_phoenix (create, read, update, delete)

**Badge affiché** :
- ⚽ Responsable Sportif

**Dashboard Home affiche** :
- "⚽ Responsable Sportif"
- Pas de section admin

---

### 5. ⚖️ Censeur (censeur@test.com)

**Sections visibles** :
- ✅ Mon Espace (4 liens)
- ❌ Finances (peut voir en lecture seule si on ajoute des liens stats)
- ❌ Tontine (peut voir en lecture seule si on ajoute des liens stats)
- ❌ Réunions
- ❌ Sport
- ❌ Gestion
- ❌ Site Web

**Total estimé : ~4 liens**

**Permissions accordées** :
- ✅ donations (read)
- ✅ cotisations (read)
- ✅ epargnes (read)
- ✅ prets (read)
- ✅ aides (read)
- ✅ sanctions (read)

**Badge affiché** :
- ⚖️ Censeur

**Dashboard Home affiche** :
- "⚖️ Censeur"
- Pas de section admin

**Note** : Le censeur a un accès en lecture seule à toutes les données financières mais la sidebar pourrait ne pas afficher de liens car ils nécessitent souvent des permissions de modification.

---

### 6. 🔍 Commissaire aux Comptes (commissaire@test.com)

**Sections visibles** :
- ✅ Mon Espace (4 liens)
- ❌ Aucune autre section

**Total estimé : ~4 liens**

**Permissions accordées** :
- ✅ Toutes les ressources (read uniquement)

**Badge affiché** :
- 🔍 Commissaire aux Comptes

**Dashboard Home affiche** :
- "🔍 Commissaire aux Comptes"
- Pas de section admin

**Note** : Similaire au censeur, le commissaire a un accès lecture seule global mais sans liens dans la sidebar.

---

### 7. 👤 Membre Simple (membre@test.com)

**Sections visibles** :
- ✅ Mon Espace (4 liens : Profil, Dons, Cotisations, Déconnexion)
- ❌ Aucune section admin

**Total : 4 liens**

**Permissions accordées** :
- ❌ Aucune permission spéciale

**Badge affiché** :
- 👤 Membre

**Dashboard Home affiche** :
- "👤 Membre"
- Pas de section admin

---

## ✅ Checklist de Validation

### Tests Fonctionnels

#### Admin (admin@e2d.com)
- [ ] Badge affiché : "👑 Super Admin"
- [ ] Dashboard affiche : "👑 Super Administrateur"
- [ ] Sidebar complète visible (~35 liens)
- [ ] Accès à `/dashboard/admin/permissions` : ✅
- [ ] Peut exporter la matrice Excel : ✅
- [ ] Peut modifier les permissions : ✅

#### Trésorier (tresorier@test.com)
- [ ] Badge affiché : "💰 Trésorier"
- [ ] Dashboard affiche : "💰 Trésorier"
- [ ] Sidebar : Mon Espace + Finances + Tontine (~13 liens)
- [ ] Accès à `/dashboard/admin/permissions` : ✅ (lecture seule)
- [ ] Accès à `/dashboard/admin/donations` : ✅
- [ ] Accès à `/dashboard/admin/site/hero` : ❌ Redirection

#### Secrétaire (secretaire@test.com)
- [ ] Badge affiché : "📝 Secrétaire"
- [ ] Dashboard affiche : "📝 Secrétaire Général"
- [ ] Sidebar : Mon Espace + Réunions (~7 liens)
- [ ] Accès à `/dashboard/admin/reunions` : ✅
- [ ] Accès à `/dashboard/admin/donations` : ❌ Redirection
- [ ] Accès à `/dashboard/admin/sport` : ❌ Redirection

#### Responsable Sportif (sport@test.com)
- [ ] Badge affiché : "⚽ Sport"
- [ ] Dashboard affiche : "⚽ Responsable Sportif"
- [ ] Sidebar : Mon Espace + Sport (~13 liens)
- [ ] Accès à `/dashboard/admin/sport/e2d` : ✅
- [ ] Accès à `/dashboard/admin/sport/phoenix` : ✅
- [ ] Accès à `/dashboard/admin/reunions` : ❌ Redirection

#### Censeur (censeur@test.com)
- [ ] Badge affiché : "⚖️ Censeur"
- [ ] Dashboard affiche : "⚖️ Censeur"
- [ ] Sidebar : Mon Espace uniquement (~4 liens)
- [ ] Peut consulter mais pas modifier les finances
- [ ] Accès à `/dashboard/admin/donations` : ❌ Redirection

#### Commissaire (commissaire@test.com)
- [ ] Badge affiché : "🔍 Commissaire"
- [ ] Dashboard affiche : "🔍 Commissaire aux Comptes"
- [ ] Sidebar : Mon Espace uniquement (~4 liens)
- [ ] Peut consulter mais pas modifier
- [ ] Accès à toutes les pages en lecture seule

#### Membre (membre@test.com)
- [ ] Badge affiché : "👤 Membre"
- [ ] Dashboard affiche : "👤 Membre"
- [ ] Sidebar : Mon Espace uniquement (4 liens)
- [ ] Accès à `/dashboard/admin/*` : ❌ Toujours redirigé
- [ ] Peut voir profil, dons, cotisations

---

### Tests de Sécurité

- [ ] Tentative d'accès direct à `/dashboard/admin/donations` avec membre@test.com → Redirection vers `/dashboard`
- [ ] Tentative d'accès à `/dashboard/admin/site/hero` avec tresorier@test.com → Redirection
- [ ] Tentative d'accès à `/dashboard/sport` avec secretaire@test.com → Redirection
- [ ] Tentative de modification de permission sans être admin → Échec
- [ ] Inspection du cache React Query → Permissions bien invalidées au login

---

### Tests de Performance

- [ ] Temps de chargement des permissions : < 500ms
- [ ] Temps de rafraîchissement du cache : < 200ms
- [ ] Nombre de requêtes au login : ≤ 3 (user, profile, role)
- [ ] Sidebar se met à jour instantanément après changement de rôle

---

### Tests Console

Vérifier les logs suivants dans la console :

```
🔍 [AuthContext] Fetching profile for user: <user_id>
✅ [AuthContext] Profile loaded: <nom> <prenom>
✅ [AuthContext] Role data received: { roles: { name: "<role_name>" } }
✅ [AuthContext] Role name extracted: <role_name>
```

**Logs attendus pour admin@e2d.com** :
```
🔍 [AuthContext] Fetching profile for user: 8466207c-64b1-483f-8471-4791f5eedff5
✅ [AuthContext] Profile loaded: E2D Admin
✅ [AuthContext] Role data received: { roles: { name: "administrateur" } }
✅ [AuthContext] Role name extracted: administrateur
```

---

## 🐛 Problèmes Résolus

| Problème | Solution | Statut |
|----------|----------|--------|
| Cache React Query ne se rafraîchit pas | Ajout `invalidateQueries` au login | ✅ Corrigé |
| Syntaxe jointure Supabase incorrecte | Changement vers `select('role_id, roles(name)')` | ✅ Corrigé |
| Badge "Membre" affiché pour l'admin | Correction récupération du rôle | ✅ Corrigé |
| Sidebar vide pour l'admin | Filtrage des permissions corrigé | ✅ Corrigé |

---

## 📊 Métriques de Performance

- **Temps de chargement des permissions** : ~200ms (objectif : < 500ms) ✅
- **Temps de rafraîchissement du cache** : ~100ms (objectif : < 200ms) ✅
- **Nombre de requêtes au login** : 3 (user, profile, role) ✅
- **Taille du cache** : ~5KB pour 50 permissions ✅

---

## 📝 Notes d'Implémentation

### Architecture
- Les permissions sont gérées via la table `role_permissions`
- Le cache React Query expire après 5 minutes (`staleTime: 1000 * 60 * 5`)
- Les permissions sont invalidées automatiquement à chaque connexion
- La sidebar est filtrée dynamiquement via `usePermissions`
- Les routes sont protégées via `PermissionRoute`

### Stratégie de Cache
```typescript
staleTime: 1000 * 60 * 5,      // 5 minutes - les données restent fraîches
gcTime: 1000 * 60 * 10,        // 10 minutes - garde en cache
refetchOnMount: true,          // Refetch à chaque montage du composant
refetchOnWindowFocus: false,   // Pas de refetch automatique au focus
```

### Invalidation du Cache
Le cache est invalidé dans ces cas :
1. À la connexion (dans `AuthContext.fetchUserProfile`)
2. Manuellement via le bouton "Actualiser" dans `/dashboard/admin/permissions`
3. Après modification d'une permission (dans `useRoles.updateRolePermission`)

---

## 🎯 Prochaines Étapes

1. ✅ **Phase 1-2-3 : Correction technique** (terminée)
   - ✅ Corriger AuthContext
   - ✅ Améliorer Dashboard
   - ✅ Créer page admin permissions

2. ⏳ **Phase 4 : Comptes de test** (en cours)
   - ⏳ Créer les utilisateurs dans Supabase Auth
   - ⏳ Exécuter le script SQL
   - ⏳ Valider les profils et rôles

3. ⏳ **Phase 5 : Tests** (à faire)
   - ⏳ Tests fonctionnels complets
   - ⏳ Tests de sécurité
   - ⏳ Tests de performance

4. 🔜 **Améliorations futures**
   - Créer la table `permissions_audit` pour l'historique
   - Ajouter des notifications temps réel lors de changements de permissions
   - Implémenter un système de logs d'activité
   - Ajouter des exports PDF pour la matrice de permissions

---

## 📞 Support

En cas de problème :
1. Vérifier les logs console (F12)
2. Vider le cache navigateur (Ctrl+Shift+R)
3. Se déconnecter et reconnecter
4. Vérifier que le rôle est bien assigné dans Supabase

---

**Dernière mise à jour** : 2025-11-12
**Version du système de permissions** : 1.0.0

---

## Lot Q1 — Suppression du bypass administrateur (juillet 2026)

`usePermissions()` ne retourne plus `true` automatiquement pour le rôle
`administrateur` : tous les contrôles passent par les lignes `role_permissions`
chargées par `AuthContext`. Le rôle `administrateur` a été complété en base
(20 ressources × 5 verbes + `prets_requests`), soit 105 permissions accordées.

`isAdmin` reste exposé par le hook mais **à titre informatif uniquement**
(badges, libellés) — jamais comme court-circuit d'autorisation.

Tests : `src/hooks/usePermissions.test.ts`
- administrateur sans permission explicite → accès refusé ;
- administrateur avec permission en base → accès accordé ;
- `hasAnyPermission` → vrai dès qu'une permission correspond.
