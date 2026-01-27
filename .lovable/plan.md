
# Plan de Correction - Test Resend Échoue

## Problème Identifié

Le test Resend échoue car l'email de test est envoyé à `test@test.com`, mais Resend en mode test (sans domaine vérifié) ne permet d'envoyer **qu'à l'adresse du propriétaire du compte** : `kankanway912@gmail.com`.

**Erreur Resend :**
```
You can only send testing emails to your own email address (kankanway912@gmail.com)
```

## Solution

### Correction 1 : Modifier le test Resend pour utiliser l'email du propriétaire

**Fichier** : `src/components/config/EmailConfigManager.tsx`

Modifier la fonction `testResendConnection` (lignes 146-166) pour :
1. Envoyer l'email de test à `kankanway912@gmail.com` (email du compte Resend)
2. OU utiliser l'email de l'utilisateur connecté

```typescript
const testResendConnection = async () => {
  setTestingResend(true);
  try {
    // Récupérer l'email de l'utilisateur connecté
    const { data: { user } } = await supabase.auth.getUser();
    const testEmail = user?.email || "kankanway912@gmail.com";
    
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: {
        to: testEmail,  // ← Envoyer à l'utilisateur connecté
        subject: "✅ Test Resend E2D - Connexion réussie",
        html: `<h1>Test réussi !</h1><p>La configuration Resend fonctionne correctement.</p>`,
      },
    });
    
    if (error) throw error;
    toast.success(`Test réussi ! Email envoyé à ${testEmail}`);
  } catch (error) {
    console.error("Resend test failed:", error);
    toast.error("Échec du test Resend. Vérifiez la clé API.");
  } finally {
    setTestingResend(false);
  }
};
```

### Correction 2 : Redéployer l'Edge Function send-email

S'assurer que la dernière version de `send-email/index.ts` est déployée avec `onboarding@resend.dev`.

---

## Fichiers à Modifier

| Fichier | Modification |
|---------|--------------|
| `src/components/config/EmailConfigManager.tsx` | Modifier `testResendConnection` pour utiliser l'email de l'utilisateur |

---

## Note Importante sur Resend

**En mode test (sans domaine vérifié) :**
- L'adresse `from` doit être `onboarding@resend.dev` ✅ (déjà corrigé)
- L'adresse `to` doit être **l'email du propriétaire du compte Resend** (`kankanway912@gmail.com`)

**Pour envoyer à n'importe qui :**
1. Aller sur https://resend.com/domains
2. Ajouter et vérifier un domaine (ex: e2d.com)
3. Changer l'adresse `from` pour utiliser ce domaine (ex: `notifications@e2d.com`)

---

## Tests de Validation

1. **Après correction** :
   - Aller dans Configuration E2D → Email
   - S'assurer que la clé Resend est enregistrée
   - Cliquer "Tester la connexion"
   - Vérifier que le toast affiche "Test réussi ! Email envoyé à [votre email]"
   - Vérifier la réception de l'email dans la boîte du compte connecté

2. **Pour l'envoi à tous les membres** :
   - Vérifier un domaine sur Resend
   - Mettre à jour l'adresse `from` dans les Edge Functions
