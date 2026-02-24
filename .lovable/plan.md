

# Code Review Complet — Etat du projet

## Resultat global

Le projet est globalement solide. Les corrections precedentes (lazyWithRetry, extraction d'erreurs edge functions) couvrent la majorite des cas critiques. Il reste **3 appels `functions.invoke`** avec le pattern d'erreur generique non corrige.

## Routes — Verification complete

Toutes les routes sont coherentes :

```text
App.tsx (8 routes)          Dashboard.tsx (42 routes)         Sidebar (42 liens)
─────────────────           ────────────────────────          ──────────────────
/                    ✅     /dashboard/                ✅     /dashboard             ✅
/auth                ✅     /dashboard/profile         ✅     /dashboard/profile     ✅
/dashboard/*         ✅     /dashboard/my-donations    ✅     /dashboard/my-donations✅
/don                 ✅     /dashboard/my-cotisations  ✅     /dashboard/my-cotisations✅
/adhesion            ✅     ... (38 admin routes)      ✅     ... (38 admin links)   ✅
/change-password     ✅
/evenements/:id      ✅     Toutes les pages member (7) et admin (35) ont des routes,
/albums/:albumId     ✅     des liens sidebar, et des fichiers de page correspondants.
*                    ✅
```

Aucune route orpheline. Aucun lien mort.

## Problemes restants (3 corrections mineures)

### Fichier 1 : `src/pages/admin/site/MessagesAdmin.tsx` (ligne 134)

L'envoi de reponse a un message de contact utilise `if (error) throw error` — affichera "Edge Function returned a non-2xx status code" en cas d'echec.

**Correction** : Remplacer par extraction du vrai message d'erreur.

### Fichier 2 : `src/components/config/EmailConfigManager.tsx` (ligne 176)

Le test Resend utilise `if (error) throw error` sans extraire `data?.error`.

**Correction** : Extraire le message reel de `data?.error`.

### Fichier 3 : `src/components/config/EmailConfigManager.tsx` (ligne 289)

Le test SMTP utilise `if (error) throw error` sans extraire `data?.error`.

**Correction** : Meme pattern que ci-dessus.

## Ce qui fonctionne correctement

- **Lazy loading avec retry** : Toutes les 41 pages lazy-loadees utilisent `lazyWithRetry` — pas de crash apres deploiement
- **ErrorBoundary** : Toutes les routes admin et member ont un `ErrorBoundary` individuel avec bouton "Reessayer"
- **Permissions** : Toutes les routes admin sont protegees par `PermissionRoute`
- **Auth** : Gestion des membres bloques/suspendus, changement de mot de passe obligatoire, expiration de session
- **`.replace()` calls** : Toutes securisees (gardes null sur `template_sujet`, `template_contenu`, `reunion.sujet`)
- **8 fichiers `functions.invoke` deja corriges** : `useDonations`, `NotificationsAdmin`, `CompteRenduActions`, `BankTransferInfo`, `CalendrierBeneficiairesManager`, `ClotureReunionModal`, `NotifierReunionModal`, `Reunions`, `CreateUserDialog`, `UserMemberLinkManager`

## Details techniques des 3 corrections

Pour chaque fichier, remplacer :
```typescript
if (error) throw error;
```
par :
```typescript
if (error) {
  const errorMessage = data?.error || error.message;
  throw new Error(errorMessage);
}
if (data?.error) throw new Error(data.error);
```

Note pour `MessagesAdmin.tsx` : le `const { error }` doit devenir `const { data, error }` pour acceder au body de la reponse.

Pour `EmailConfigManager.tsx` ligne 176 (test Resend) : la variable `data` est deja declaree dans le scope, il suffit de remplacer le `throw error` par l'extraction.

## Resume des modifications

| Fichier | Ligne | Correction |
|---|---|---|
| `src/pages/admin/site/MessagesAdmin.tsx` | 121, 134 | Destructurer `data`, extraire `data?.error` |
| `src/components/config/EmailConfigManager.tsx` | 176 | Extraire `data?.error` au lieu de `throw error` |
| `src/components/config/EmailConfigManager.tsx` | 289 | Extraire `data?.error` au lieu de `throw error` |

