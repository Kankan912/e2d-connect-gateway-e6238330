## Lot C — Utilisateurs, Permissions, Email (Phases 2, 3, 13)

Audit ciblé sans nouvelles fonctionnalités. Vérification + corrections d'anomalies confirmées uniquement.

### Périmètre

**Phase 2 — Membres & comptes utilisateurs**
- Liaison `membres` ↔ `auth.users` / `profiles`
- Règle : un compte utilisateur doit toujours être rattaché à un membre
- Cycle de vie : création, premier login (changement mdp obligatoire), `actif` / `inactif` / `suspendu` / `supprime`
- Déconnexion forcée des comptes inactifs/suspendus (memory `auth-block-logic`)
- Soft-delete `status="supprime"` (memory `user-deletion-and-logging-workflow`)

**Phase 3 — Rôles & permissions**
- Rôle officiel `administrateur` (jamais `admin`) — vérifier toutes occurrences
- `has_role()` et `has_permission(_resource, _permission)` security definer
- `is_admin()` utilisé dans les RLS
- Permissions granulaires (memory `granular-permissions`)
- Accès admin dashboard via `hasAnyPermission` (memory `admin-access-logic-v35`)

**Phase 13 — Configuration Email (Resend / SMTP natif)**
- Architecture multi-provider (memory `multi-provider-native-smtp-architecture-v2`)
- Sauvegarde config avec `.select()` pour détecter échec RLS silencieux (memory `email-config-save-validation`)
- Extraction email pur + forçage Resend pour tests connexion (memory `delivery-logic`)
- Clés API jamais exposées frontend
- Logs envois complets

### Méthode

1. **Audit code** : hooks/composants liés à `useAuth`, `useMembers`, `usePermissions`, `EmailConfig*`, edge functions email.
2. **Audit DB** : `supabase--read_query` pour vérifier :
   - Cohérence `membres` ↔ `profiles` ↔ `auth.users` (orphelins ?)
   - Présence d'enregistrements `role = 'admin'` au lieu de `administrateur`
   - RLS sur `configurations` / `configurations_email` (clés API en clair ?)
3. **Audit RLS** via `security--get_table_schema` sur tables sensibles (`user_roles`, `configurations`, `audit_logs`).
4. **Tests UI ciblés** : login membre inactif/suspendu/supprimé doit être bloqué ; sauvegarde config email doit remonter une erreur explicite si RLS bloque.
5. **Documentation** : nouvelle section "Lot C" dans `docs/AUDIT_E2D_V3.md` avec constats + correctifs + tests à valider.

### Points de vigilance

- **C1** — Aucun rôle `admin` orphelin (doit être `administrateur`)
- **C2** — Aucun compte `auth.users` sans `membres` correspondant (orphelin)
- **C3** — Comptes `inactif`/`suspendu`/`supprime` réellement bloqués au login
- **C4** — Sauvegarde config email : `.select()` chaîné pour détecter RLS silencieux
- **C5** — Clés API email **jamais** lisibles via `configurations` côté client (vue `configurations_public` utilisée)
- **C6** — `has_permission` correctement appelée dans les routes admin
- **C7** — Logs `audit_logs` enregistrent bien `auth.uid()` (pas null)

### Livrables

- `docs/AUDIT_E2D_V3.md` enrichi (section Lot C)
- Migrations SQL si anomalies confirmées (ex : alignement rôle, durcissement RLS)
- Edits frontend ciblés uniquement sur anomalies confirmées
- Liste tests utilisateur avant Lot D

### Hors périmètre

- Refonte UI gestion utilisateurs / permissions
- Nouveau provider email
- Modifications schémas réservés Supabase (`auth`, `storage`, etc.)

Après validation Lot C → Lot D (Matchs, Évènements, Site web, Galerie).
