

# Phase 1 — Stabilité & Corrections de bugs critiques (pages blanches)

## Diagnostic confirmé

### 1. ErrorBoundary : une seule instance globale insuffisante
`Dashboard.tsx` ligne 97 enveloppe **toutes les routes** dans un seul `ErrorBoundary`. Si un module crash (ex: Trésorerie, Notifications), c'est l'intégralité du dashboard qui affiche l'écran d'erreur. L'utilisateur perd tout contexte de navigation.

### 2. Notifications : pas de page blanche détectée
`NotificationsAdmin.tsx` gère déjà `isError` avec un fallback propre (lignes 188-210) et utilise `fk_notifications_campagnes_created_by` pour la jointure. Le module est robuste. Pas de correction nécessaire.

### 3. Cotisations : "Aucun exercice actif"
`CotisationsCumulAnnuel.tsx` (lignes 27-34) cherche `statut = 'actif'` avec `maybeSingle()` — gère correctement l'absence d'exercice actif et affiche un message (ligne 193). `CotisationsGridView.tsx` affiche un avertissement si pas d'exercice (lignes 312-321).
**Le vrai problème** : `Reunions.tsx` > `CotisationsTabContent` (ligne 299) initialise `selectedExercice = "all"` au lieu de pré-sélectionner l'exercice actif, ce qui force l'utilisateur à le choisir manuellement. Le `exerciceId` passé à `CotisationsGridView` est `currentExercice?.id` (ligne 471), qui dépend de `getExerciceForReunion` — si la date de la réunion ne tombe dans aucun exercice, il reste `undefined`.

### 4. AuthApiError : Refresh Token expiré
La console montre `AuthApiError: Invalid Refresh Token`. Pas de gestion gracieuse dans `AuthContext` — le token expiré peut provoquer des boucles de requêtes échouées.

---

## Plan d'exécution

### A. ErrorBoundary par groupe de routes (Dashboard.tsx)

Envelopper chaque `Route` critique dans un `ErrorBoundary` individuel au lieu d'un seul global. Créer un wrapper réutilisable `SafeRoute` :

```tsx
const SafeRoute = ({ children }: { children: React.ReactNode }) => (
  <ErrorBoundary>{children}</ErrorBoundary>
);
```

Appliquer sur les groupes de routes à risque :
- Routes Finance (Caisse, Épargnes, Bénéficiaires, Prêts)
- Routes Réunions (Réunions, Présences)
- Routes Sport (E2D, Phoenix, Équipes)
- Routes Communication (Notifications, Templates)
- Routes CMS (toutes les pages site/*)
- Routes Membre (cotisations perso, sanctions perso, etc.)

Chaque crash sera isolé à sa section sans affecter le reste du dashboard.

### B. Cotisations : pré-sélection exercice actif

**Fichier : `src/pages/Reunions.tsx`** — `CotisationsTabContent`
- Ligne 299 : remplacer `useState("all")` par un `useEffect` qui pré-sélectionne l'exercice avec `statut === 'actif'` dès le chargement des exercices
- Ajouter un fallback : si aucun exercice actif, afficher un message explicite au lieu d'un état vide silencieux

### C. AuthContext : gestion du refresh token expiré

**Fichier : `src/contexts/AuthContext.tsx`**
- Dans le listener `onAuthStateChange`, intercepter l'événement `TOKEN_REFRESHED` échoué
- Si `event === 'TOKEN_REFRESHED'` et pas de session valide : appeler `signOut()` proprement et rediriger vers `/auth`
- Éviter les boucles de requêtes avec un token invalide

### D. ErrorBoundary : ajout d'un reset de state

**Fichier : `src/components/ErrorBoundary.tsx`**
- Ajouter une prop optionnelle `onReset` et un bouton "Réessayer" qui appelle `setState({ hasError: false })` au lieu de `window.location.reload()` — plus léger et conserve la session
- Ajouter le support d'une `key` prop pour reset automatique au changement de route

---

## Fichiers modifiés

| Fichier | Modification | Impact |
|---|---|---|
| `src/components/ErrorBoundary.tsx` | Ajout reset state + key prop | Meilleure UX de récupération |
| `src/pages/Dashboard.tsx` | ErrorBoundary par groupe de routes via `SafeRoute` | Isolation des crashs |
| `src/pages/Reunions.tsx` | Pré-sélection exercice actif dans `CotisationsTabContent` | Fin du message "aucun exercice" |
| `src/contexts/AuthContext.tsx` | Gestion gracieuse du refresh token expiré | Fin des boucles d'erreurs auth |

## Ce qui n'est PAS modifié
- `NotificationsAdmin.tsx` — déjà robuste avec `isError` handler
- `useCotisations.ts` — hooks corrects, pas de bug détecté
- `CotisationsGridView.tsx` — affiche déjà un message si pas d'exercice
- `CotisationsCumulAnnuel.tsx` — gère déjà `maybeSingle()` correctement

