

# Plan de Correction - Test Resend en Mode Test

## Problème Identifié

Le test Resend échoue car :
1. Vous êtes connecté avec un compte dont l'email n'est **pas** `kankanway912@gmail.com`
2. En mode test Resend (sans domaine vérifié), on ne peut envoyer qu'à l'email du propriétaire du compte Resend : `kankanway912@gmail.com`

## Solution

Modifier le code pour **toujours** utiliser l'email du compte Resend en mode test, avec un avertissement clair à l'utilisateur.

### Modification

**Fichier** : `src/components/config/EmailConfigManager.tsx`

```typescript
const testResendConnection = async () => {
  setTestingResend(true);
  try {
    // En mode test Resend (sans domaine vérifié), on ne peut envoyer
    // qu'à l'adresse du propriétaire du compte Resend
    const resendOwnerEmail = "kankanway912@gmail.com";
    
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: {
        to: resendOwnerEmail,
        subject: "✅ Test Resend E2D - Connexion réussie",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #22c55e;">✅ Test Resend réussi !</h1>
            <p>La configuration email de votre application E2D fonctionne correctement.</p>
            <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
              Ce message a été envoyé depuis la configuration E2D le ${new Date().toLocaleString('fr-FR')}.
            </p>
          </div>
        `,
      },
    });
    
    if (error) throw error;
    toast.success(`Test réussi ! Email envoyé à ${resendOwnerEmail}`, { 
      icon: <CheckCircle className="h-4 w-4 text-green-500" /> 
    });
  } catch (error: any) {
    console.error("Resend test failed:", error);
    toast.error("Échec du test Resend: " + (error.message || "Vérifiez la clé API"), { 
      icon: <XCircle className="h-4 w-4 text-red-500" /> 
    });
  } finally {
    setTestingResend(false);
  }
};
```

### Ajouter un message d'information dans l'UI

Ajouter un encadré d'information expliquant la limitation du mode test :

```tsx
<Alert className="mb-4">
  <Info className="h-4 w-4" />
  <AlertDescription>
    <strong>Mode Test Resend :</strong> Sans domaine vérifié, les emails ne peuvent être envoyés 
    qu'à l'adresse du propriétaire du compte Resend ({resendOwnerEmail}). 
    Pour envoyer à tous les membres, <a href="https://resend.com/domains" target="_blank" className="underline">vérifiez un domaine</a>.
  </AlertDescription>
</Alert>
```

---

## Fichiers à Modifier

| Fichier | Modification |
|---------|--------------|
| `src/components/config/EmailConfigManager.tsx` | Utiliser l'email fixe du compte Resend + ajouter message d'info |

---

## Solution à Long Terme

Pour envoyer des emails à **tous les destinataires** :

1. Aller sur https://resend.com/domains
2. Ajouter votre domaine (ex: e2d.com)
3. Configurer les enregistrements DNS (MX, SPF, DKIM)
4. Une fois vérifié, mettre à jour l'adresse `from` dans les Edge Functions :
   ```typescript
   from: 'E2D <notifications@e2d.com>'
   ```

---

## Estimation

| Tâche | Temps |
|-------|-------|
| Corriger testResendConnection | 10 min |
| Ajouter message d'information | 10 min |
| Test et validation | 5 min |
| **Total** | **~25 min** |

