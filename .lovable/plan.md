

# Plan : Corriger la persistance du choix de service email

## Probleme

Le composant `EmailConfigManager` initialise `emailService` a `"resend"` par defaut (ligne 24) avant que la valeur sauvegardee en base (`smtp`) ne soit chargee par le `useEffect` (ligne 66-78). Lors d'un changement de page et retour, le cache React Query peut ne pas declencher le `useEffect` au bon moment, laissant le choix fige sur la valeur par defaut `"resend"` au lieu de la valeur DB `"smtp"`.

**Cause racine** : L'etat local (`useState`) avec une valeur par defaut statique est desynchronise du cache React Query. Le `useEffect` qui synchronise ne se relance que quand la **reference** de `configs` change, pas forcement quand le composant remonte avec des donnees en cache.

## Solution

Remplacer l'approche `useState` + `useEffect` par une initialisation directe depuis les donnees React Query, en utilisant les donnees du cache comme source de verite.

### Fichier : `src/components/config/EmailConfigManager.tsx`

**Action 1 — Deriver `emailService` directement des donnees chargees**

Au lieu de :
```typescript
const [emailService, setEmailService] = useState<"resend" | "smtp">("resend");
// ... useEffect qui synchronise
```

Utiliser un pattern ou l'etat local n'est initialise qu'une seule fois via une ref, ou mieux : garder le `useState` mais forcer la synchronisation a chaque changement de `configs` en ajoutant un indicateur `isInitialized` :

```typescript
const [emailService, setEmailService] = useState<"resend" | "smtp" | null>(null);
```

Puis dans le `useEffect`, toujours ecrire la valeur (pas seulement si truthy). Le composant affiche un loader tant que `emailService === null`.

**Action 2 — Supprimer les gardes conditionnelles dans le useEffect**

Lignes 73-76 : remplacer les `if (config?.valeur)` par des affectations inconditionnelles avec fallback :

```typescript
useEffect(() => {
  if (configs) {
    const emailServiceConfig = configs.find(c => c.cle === "email_service");
    const appUrlConfig = configs.find(c => c.cle === "app_url");
    const emailExpConfig = configs.find(c => c.cle === "email_expediteur");
    const emailExpNomConfig = configs.find(c => c.cle === "email_expediteur_nom");
    
    setEmailService((emailServiceConfig?.valeur as "resend" | "smtp") || "resend");
    setAppUrl(appUrlConfig?.valeur || "");
    setEmailExpediteur(emailExpConfig?.valeur || "");
    setEmailExpediteurNom(emailExpNomConfig?.valeur || "");
  }
}, [configs]);
```

**Action 3 — Afficher le loader tant que l'etat n'est pas initialise**

Modifier la condition de chargement (ligne 304) pour inclure `emailService === null` :

```typescript
if (configsLoading || smtpLoading || emailService === null) {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
    </div>
  );
}
```

**Action 4 — Forcer le refetch apres sauvegarde**

Dans `onSuccess` de `saveConfigMutation` (ligne 140), ajouter `refetchType: 'all'` pour garantir le rechargement :

```typescript
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["email-configurations"], refetchType: "all" });
  queryClient.invalidateQueries({ queryKey: ["smtp-config"], refetchType: "all" });
  toast.success("Configuration email sauvegardée");
},
```

## Fichier modifie

| Fichier | Modification |
|---|---|
| `src/components/config/EmailConfigManager.tsx` | Init `emailService` a `null`, sync inconditionnelle depuis DB, loader en attendant, refetch force apres save |

## Impact
- Le choix Resend / SMTP est toujours lu depuis la base au montage
- Aucun flash de valeur par defaut incorrecte
- Le changement de page et retour conserve le bon choix
- La sauvegarde force un rechargement complet des donnees

