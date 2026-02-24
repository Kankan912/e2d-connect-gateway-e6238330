

# Phase 3 — Verdict : CONFORME

Les 3 points du plan ont ete correctement implementes :

**1. Apercu montant total dans dialog d'ajout** — `CalendrierBeneficiairesManager.tsx` lignes 590-601 : le dialog d'ajout affiche desormais un calcul `montant_mensuel x 12 = montant_total` base sur les cotisations mensuelles du membre selectionne. Conforme.

**2. Tri automatique des rangs apres changement de mois** — Lignes 356-371 : apres `updateBeneficiaire`, le code trie par `mois_benefice` croissant, detecte si l'ordre a change, et propose un `window.confirm` pour reordonner automatiquement. Conforme.

**3. Edge Function notifications** — `send-calendrier-beneficiaires` est deployee et operationnelle. L'envoi echoue uniquement a cause de la configuration SMTP (Outlook AUTH desactive) — pas un bug de code. Conforme.

**Phase 3 validee. Passage a la Phase 4.**

---

# Phase 4 — Robustesse & Qualite de Code

Audit des modules restants non encore revus : Presences, Sidebar, DashboardHome, Espaces personnels, Gestion de session.

## Audit du code existant

| Module | Statut | Observations |
|---|---|---|
| DashboardSidebar | OK | Filtrage permissions correct, badge prets en retard fonctionnel |
| DashboardHome | OK | Resume personnel, actions rapides, badge role |
| PermissionRoute | OK | Redirect `/dashboard` si pas de permission |
| usePermissions | OK | Cache 5min, enforcePermission avec toast |
| useSessionManager | OK | Gestion inactivite + expiration session |
| MyPrets | OK | Progress bar remboursement, badges statut |
| MyCotisations | OK | Recap par type, total paye |

## Points a corriger (Phase 4)

### 1. GestionPresences — pas de React Query, state manuel

`GestionPresences.tsx` utilise `useState` + `useEffect` + `supabase` directement au lieu de React Query. C'est le seul module majeur qui n'utilise pas ce pattern. Consequences :
- Pas de cache (rechargement complet a chaque visite)
- Pas de refetch automatique
- Pas de gestion optimiste des mutations
- `loadData()` dans `useEffect([], [])` sans dependance sur `selectedDate` — les presences ne se rechargent pas automatiquement quand la date change (il faut appeler `loadPresences()` manuellement)

**Action** : Refactorer `GestionPresences.tsx` pour utiliser React Query (`useQuery` pour le chargement, `useMutation` pour les toggles de presence). Ajouter `selectedDate` et `selectedTypeSeance` dans les `queryKey` pour que les presences se rechargent automatiquement.

### 2. DashboardHome — section admin limitee a 2 roles

Ligne 28 : `hasAdminAccess = userRole === "administrateur" || userRole === "tresorier"`. Les roles secretaire, responsable sportif, censeur, commissaire n'ont pas de section admin dans le dashboard home, meme s'ils ont des permissions d'acces. La sidebar leur donne acces, mais le dashboard ne le montre pas.

**Action** : Remplacer le check `hasAdminAccess` par une verification basee sur les permissions (`hasAnyPermission`) au lieu de hardcoder les noms de roles. Afficher la section admin si l'utilisateur a au moins une permission de lecture sur n'importe quelle ressource admin.

### 3. DashboardSidebar — role "membre" non affiche dans le badge

Ligne 248 : le badge role ne couvre pas le role `"membre"`. Un utilisateur avec `userRole === "membre"` voit `📋 membre` au lieu de `👤 Membre` car la condition catch-all affiche le nom brut du role.

**Action** : Ajouter `{userRole === 'membre' && '👤 Membre'}` dans la liste des conditions du badge sidebar.

### 4. window.confirm dans CalendrierBeneficiairesManager

Le `window.confirm` ajoute en Phase 3 (ligne 362) casse l'UX de l'application qui utilise des `AlertDialog` shadcn/ui partout ailleurs. Cela genere aussi un warning dans certains navigateurs mobiles.

**Action** : Remplacer le `window.confirm` par un `AlertDialog` shadcn/ui avec state gere localement (`showReorderDialog`).

---

## Fichiers a modifier (Phase 4)

| Fichier | Modification | Impact |
|---|---|---|
| `src/pages/GestionPresences.tsx` | Migrer vers React Query | Performance, cache, coherence |
| `src/pages/dashboard/DashboardHome.tsx` | Section admin basee sur permissions | Acces correct pour tous les roles |
| `src/components/layout/DashboardSidebar.tsx` | Badge role "membre" | Affichage coherent |
| `src/components/config/CalendrierBeneficiairesManager.tsx` | Remplacer `window.confirm` par `AlertDialog` | UX coherente, compatibilite mobile |

## Ce qui n'est PAS modifie
- `usePermissions.ts` — cache et logique corrects
- `PermissionRoute.tsx` — protection de route fonctionnelle
- `useSessionManager.ts` — gestion de session complete avec inactivite et expiration
- `usePersonalData.ts` — hooks React Query pour les espaces membres
- Pages `My*.tsx` — espaces personnels complets et fonctionnels

