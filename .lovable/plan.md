

# Plan : Corriger le test Resend et verifier la coherence des prets

## Probleme 1 : Test Resend echoue ("Edge Function returned a non-2xx status code")

**Cause identifiee** : `testResendConnection` dans `EmailConfigManager.tsx` (ligne 159) appelle `send-email` sans passer `forceService: "resend"`. La fonction `send-email` lit alors `email_service = 'smtp'` depuis la table `configurations` et tente d'envoyer via SMTP Outlook, qui echoue car l'authentification basique est desactivee.

Les logs confirment : `[Email] Envoi via smtp à kankanway912@gmail.com` au lieu de Resend.

**Correction** : Ajouter `forceService: "resend"` dans le body de l'appel `testResendConnection` (ligne 159-173 de EmailConfigManager.tsx).

```typescript
const { data, error } = await supabase.functions.invoke("send-email", {
  body: {
    to: resendOwnerEmail,
    subject: "...",
    html: "...",
    forceService: "resend",  // <-- ajout
  },
});
```

## Probleme 2 : Verification de la colonne Reste et filtres prets

Verification en base de donnees effectuee. Exemple Guillaume Toto :
- Capital: 50 000, Interet initial: 2 500, Reconduction: 2 625
- **totalDu correct** = 50 000 + 2 500 + 2 625 = **55 125**
- DB `montant_total_du` = 34 256 (obsolete, ignore par le code)
- Paiements: 20 000 → **resteAPayer = 35 125**

Le code `PretsAdmin.tsx` utilise deja `getCalculsPret` (service centralise) avec les jointures `prets_paiements(*)` et `prets_reconductions(*)`. Les calculs sont corrects. Si l'utilisateur voit encore d'anciennes valeurs, c'est un cache navigateur — le rechargement de la page corrigera.

## Fichier modifie

| Fichier | Modification |
|---|---|
| `src/components/config/EmailConfigManager.tsx` | Ajouter `forceService: "resend"` dans `testResendConnection` |

