
# Plan de Correction - Problèmes Identifiés avec Preuves

## Diagnostic des 3 Problèmes Signalés

### Problème 1 : Échec du test Resend (Image 80)

**Cause identifiée** : La clé API Resend n'est PAS enregistrée dans la base de données !
```sql
SELECT valeur FROM configurations WHERE cle = 'resend_api_key';
-- Résultat : valeur = "" (vide)
```

**Pourquoi** : L'edge function `update-email-config/index.ts` fait un `upsert` mais la ligne n'existe pas initialement. L'upsert nécessite que la colonne `cle` soit définie comme contrainte unique. L'erreur dans les logs PostgreSQL confirme : 
```
"duplicate key value violates unique constraint configurations_cle_key"
```

Cela indique que l'insertion échoue car la clé existe déjà mais avec une valeur vide, et le conflit n'est pas géré correctement.

**Correction** :
1. Modifier l'edge function pour utiliser `upsert` avec `onConflict: 'cle'` explicitement
2. Vérifier que la ligne existe d'abord, sinon l'insérer

---

### Problème 2 : 0 emails envoyés - Notification calendrier (Image 81)

**Cause identifiée** : Domaine Resend non vérifié + Rate limiting

Les logs Edge Function montrent clairement les erreurs :
```
statusCode: 403
message: "You can only send testing emails to your own email address (kankanway912@gmail.com). To send emails to other recipients, please verify a domain at resend.com/domains"
```

Et aussi :
```
statusCode: 429
message: "Too many requests. You can only make 2 requests per second"
```

**Problèmes** :
1. Le domaine `e2d.com` n'est pas vérifié sur Resend
2. L'adresse `from` utilise `notifications@resend.dev` qui ne peut envoyer qu'à soi-même en mode test
3. Les emails sont envoyés trop rapidement sans délai entre chaque requête

**Corrections** :
1. Modifier l'adresse `from` pour utiliser `onboarding@resend.dev` (adresse de test Resend autorisée pour tous)
2. Ajouter un délai de 600ms entre chaque envoi pour respecter le rate limit de 2/seconde
3. Afficher clairement les informations de domaine dans l'UI

---

### Problème 3 : Page blanche sur onglet Notifications (Image 82)

**Cause identifiée** : Erreur non gérée dans les composants enfants

L'onglet Notifications charge `NotificationsAdmin embedded={true}` qui fait des requêtes à :
- `notifications_campagnes`
- `notifications_templates`
- `configurations` (pour les triggers)

Si une de ces requêtes échoue silencieusement ou si un composant enfant plante, il n'y a pas d'ErrorBoundary pour afficher une erreur propre.

**Corrections** :
1. Ajouter un composant `ErrorBoundary` global dans `App.tsx`
2. Ajouter des fallbacks de chargement/erreur dans `NotificationsAdmin`
3. Vérifier que toutes les tables existent

---

## Plan d'Implémentation

### Correction 1 : Réparer la sauvegarde de la clé Resend

**Fichier** : `supabase/functions/update-email-config/index.ts`

Modifier les lignes 95-101 pour gérer correctement l'upsert :

```typescript
// Avant : upsert simple qui peut échouer
await supabase.from("configurations").upsert({
  cle: "resend_api_key",
  valeur: resend_api_key,
  description: "Clé API Resend"
});

// Après : upsert avec gestion explicite du conflit
const { error: upsertError } = await supabase
  .from("configurations")
  .upsert(
    { 
      cle: "resend_api_key", 
      valeur: resend_api_key, 
      description: "Clé API Resend pour l'envoi d'emails" 
    }, 
    { onConflict: "cle" }
  );

if (upsertError) {
  console.error("Erreur upsert resend_api_key:", upsertError);
  throw new Error("Impossible de sauvegarder la clé Resend");
}
```

### Correction 2 : Réparer l'envoi d'emails calendrier

**Fichier** : `supabase/functions/send-calendrier-beneficiaires/index.ts`

Modifications :
1. Changer l'adresse `from` de `notifications@resend.dev` à `onboarding@resend.dev`
2. Ajouter un délai de 600ms entre chaque envoi (rate limit Resend = 2/sec)

```typescript
// Ligne 176 - Changer from
from: "E2D <onboarding@resend.dev>",  // Adresse de test autorisée

// Après chaque envoi réussi, ajouter un délai
if (response.ok) {
  emailsSent++;
  console.log(`Email envoyé à ${membre.email}`);
  // Respecter le rate limit Resend (2 req/sec)
  await new Promise(resolve => setTimeout(resolve, 600));
} else {
  throw new Error(await response.text());
}
```

**Fichier** : `supabase/functions/send-email/index.ts`

Même correction pour l'adresse from (ligne 89) :
```typescript
from: 'E2D <onboarding@resend.dev>',  // Au lieu de noreply@e2d.com
```

### Correction 3 : Ajouter ErrorBoundary global

**Nouveau fichier** : `src/components/ErrorBoundary.tsx`

```typescript
import React from "react";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  ErrorBoundaryState
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-muted/30">
          <div className="text-center space-y-4 p-8 max-w-md">
            <AlertTriangle className="h-16 w-16 text-destructive mx-auto" />
            <h1 className="text-2xl font-bold">Une erreur est survenue</h1>
            <p className="text-muted-foreground">
              Nous nous excusons pour ce désagrément.
            </p>
            {this.state.error && (
              <p className="text-sm text-red-600 bg-red-50 p-2 rounded">
                {this.state.error.message}
              </p>
            )}
            <div className="flex gap-4 justify-center">
              <Button variant="outline" onClick={() => window.location.reload()}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
              <Button onClick={() => window.location.href = "/dashboard"}>
                <Home className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
```

**Fichier** : `src/App.tsx`

Envelopper l'application avec ErrorBoundary :
```typescript
import { ErrorBoundary } from "@/components/ErrorBoundary";

// Dans le return
return (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      {/* ... reste de l'app */}
    </QueryClientProvider>
  </ErrorBoundary>
);
```

### Correction 4 : Améliorer le composant NotificationsAdmin

**Fichier** : `src/pages/admin/NotificationsAdmin.tsx`

Ajouter un fallback d'erreur dans le composant :

```typescript
// Après la ligne 64 (fin de la query campagnes)
const { data: campagnes, isLoading, isError, error } = useQuery({
  // ... existant
});

// Dans le return, avant le contenu principal
if (isError) {
  return (
    <div className="p-6 text-center">
      <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
      <h2 className="text-lg font-semibold mb-2">Erreur de chargement</h2>
      <p className="text-muted-foreground">
        Impossible de charger les notifications. Vérifiez votre connexion.
      </p>
      <p className="text-sm text-red-500 mt-2">{error?.message}</p>
    </div>
  );
}
```

---

## Fichiers à Modifier

| Fichier | Action | Priorité |
|---------|--------|----------|
| `supabase/functions/update-email-config/index.ts` | Corriger upsert avec onConflict | CRITIQUE |
| `supabase/functions/send-calendrier-beneficiaires/index.ts` | Changer from + ajouter délai | CRITIQUE |
| `supabase/functions/send-email/index.ts` | Changer from address | CRITIQUE |
| `src/components/ErrorBoundary.tsx` | CRÉER - Nouveau fichier | HAUTE |
| `src/App.tsx` | Wrapper avec ErrorBoundary | HAUTE |
| `src/pages/admin/NotificationsAdmin.tsx` | Ajouter gestion erreur | MOYENNE |

---

## Migration SQL Nécessaire

Avant les corrections, s'assurer que la clé resend_api_key existe :

```sql
INSERT INTO configurations (cle, valeur, description, categorie)
VALUES ('resend_api_key', '', 'Clé API Resend pour l''envoi d''emails', 'email')
ON CONFLICT (cle) DO NOTHING;
```

---

## Estimation

| Tâche | Temps |
|-------|-------|
| Correction update-email-config | 15 min |
| Correction send-calendrier-beneficiaires | 20 min |
| Correction send-email | 10 min |
| Création ErrorBoundary + App.tsx | 20 min |
| Amélioration NotificationsAdmin | 15 min |
| Tests et vérifications | 20 min |
| **Total** | **~1h40** |

---

## Tests de Validation

1. **Test clé Resend** :
   - Aller dans Configuration E2D → Email
   - Saisir une clé Resend valide (commençant par `re_`)
   - Cliquer "Enregistrer la clé API"
   - Vérifier en base : `SELECT valeur FROM configurations WHERE cle = 'resend_api_key'`
   - Cliquer "Tester la connexion" → doit afficher succès

2. **Test envoi calendrier** :
   - Aller dans Configuration E2D → Tontine → Calendrier des Bénéficiaires
   - Cliquer "Notifier les membres"
   - Vérifier les logs Edge Function : plus d'erreur 403 pour l'adresse from
   - Vérifier qu'il n'y a plus d'erreur 429 (rate limit)

3. **Test page Notifications** :
   - Aller dans Configuration E2D → Notifications
   - La page doit s'afficher avec les 4 statistiques et le tableau
   - Si erreur, un message d'erreur propre doit s'afficher (pas de page blanche)

4. **Test ErrorBoundary** :
   - Provoquer une erreur intentionnelle dans un composant
   - Vérifier que l'écran d'erreur avec boutons "Actualiser" et "Dashboard" s'affiche

---

## Note Importante sur Resend

Pour envoyer des emails à **tous les destinataires** (pas seulement à soi-même), l'utilisateur doit :

1. Aller sur https://resend.com/domains
2. Ajouter et vérifier un domaine (ex: e2d.com)
3. Mettre à jour l'adresse `from` dans les Edge Functions pour utiliser ce domaine vérifié (ex: `notifications@e2d.com`)

En mode test, seul `onboarding@resend.dev` permet d'envoyer à n'importe qui, mais avec une limite de 100 emails/jour.
