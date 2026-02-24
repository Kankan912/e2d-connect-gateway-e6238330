

# Code Review Complet — Problemes identifies et corrections

## Probleme principal visible (capture d'ecran)

L'erreur **"Failed to fetch dynamically imported module: .../MembresAdmin-po6ly24a.js"** est causee par les **chunks Vite perimees apres un nouveau deploiement**. Quand l'application est redeployee, les noms de fichiers JS changent (hashes differents). Si un utilisateur a un onglet ouvert avec l'ancien manifest, la navigation lazy charge un fichier qui n'existe plus → crash.

## Problemes identifies

### 1. Chunks perimees — Lazy loading sans retry (CRITIQUE)

**Fichiers** : `src/App.tsx`, `src/pages/Dashboard.tsx`

Toutes les ~40 routes utilisent `lazy(() => import(...))` sans mecanisme de retry. Apres chaque deploiement, les utilisateurs avec un onglet ouvert obtiennent le crash montre dans la capture.

**Correction** : Creer un helper `lazyWithRetry` qui detecte les erreurs de chargement de module et force un rechargement de la page (une seule fois pour eviter une boucle infinie) :

```typescript
// src/lib/lazyWithRetry.ts
import { lazy, ComponentType } from "react";

export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
) {
  return lazy(() =>
    factory().catch((err) => {
      // Si c'est une erreur de chunk (deploiement), recharger une seule fois
      const key = "chunk_reload_" + window.location.pathname;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        window.location.reload();
        return new Promise(() => {}); // ne jamais resoudre
      }
      sessionStorage.removeItem(key);
      throw err;
    })
  );
}
```

Puis remplacer tous les `lazy(() => import(...))` par `lazyWithRetry(() => import(...))` dans `App.tsx` et `Dashboard.tsx`.

### 2. Edge function invocations — messages d'erreur generiques (MOYEN)

**Fichiers** : 12 fichiers avec `supabase.functions.invoke`

Le meme probleme que `UserMemberLinkManager` (corrige precedemment) existe dans **11 autres endroits**. Quand une edge function retourne un status non-2xx, le SDK met l'erreur reelle dans `data?.error` mais le code fait `if (error) throw error`, affichant "Edge Function returned a non-2xx status code" au lieu du vrai message.

**Fichiers concernes** :
- `src/hooks/useDonations.ts` (ligne 53)
- `src/pages/admin/NotificationsAdmin.tsx` (ligne 146)
- `src/components/CompteRenduActions.tsx` (ligne 163)
- `src/components/donations/BankTransferInfo.tsx` (ligne 69)
- `src/components/donations/MobileMoneyInfo.tsx` (ligne 88)
- `src/components/config/EmailConfigManager.tsx` (lignes 159, 196, 263, 413)
- `src/components/config/CalendrierBeneficiairesManager.tsx` (ligne 318)
- `src/components/ClotureReunionModal.tsx` (ligne 362)
- `src/components/NotifierReunionModal.tsx` (ligne 152)
- `src/pages/Reunions.tsx` (ligne 112)
- `src/components/admin/CreateUserDialog.tsx` (ligne 95)

**Correction** : Pour chaque appel, remplacer :
```typescript
if (error) throw error;
```
par :
```typescript
if (error) {
  const errorMessage = data?.error || error.message;
  throw new Error(errorMessage);
}
if (data?.error) {
  throw new Error(data.error);
}
```

### 3. Routes — Verification de coherence

Toutes les routes definies dans `Dashboard.tsx` ont un lien correspondant dans `DashboardSidebar.tsx`. **Aucune route orpheline ou lien mort detecte.** Les 42 routes du sidebar pointent toutes vers des composants existants.

Une page existe sans route directe : `src/pages/MatchResults.tsx` — mais elle est utilisee comme **composant** dans `Sport.tsx` (tab "e2d-resultats"), donc c'est correct.

### 4. `.replace()` sur valeurs potentiellement nulles (MINEUR)

Deja corrige dans les messages precedents pour `NotificationsTemplatesAdmin.tsx` et `CompteRenduViewer.tsx`. Les autres appels `.replace()` dans le projet operent sur des valeurs garanties non-null (chaines statiques, parametres requis, ou protegees par des gardes existantes).

## Resume des modifications

| # | Fichier | Action | Priorite |
|---|---|---|---|
| 1 | **`src/lib/lazyWithRetry.ts`** (nouveau) | Helper de retry pour lazy loading | CRITIQUE |
| 2 | **`src/App.tsx`** | Remplacer `lazy` par `lazyWithRetry` (8 imports) | CRITIQUE |
| 3 | **`src/pages/Dashboard.tsx`** | Remplacer `lazy` par `lazyWithRetry` (33 imports) | CRITIQUE |
| 4 | **11 fichiers** avec `functions.invoke` | Extraire `data?.error` avant de throw | MOYEN |

## Impact

- Plus de crash apres deploiement (les utilisateurs avec un onglet ouvert seront redirigees proprement)
- Messages d'erreur reels affiches partout (pas de "Edge Function returned a non-2xx status code" generique)
- Aucun changement fonctionnel visible pour les cas qui fonctionnent deja

