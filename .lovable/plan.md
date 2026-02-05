
# Plan de correction SMTP pour Outlook

## Probleme identifie

Le serveur Microsoft Outlook rejette l'authentification `AUTH LOGIN` meme avec un mot de passe d'application. Les logs montrent :

```
AUTH LOGIN echoue: 504 5.7.4 Unrecognized authentication type (encryption "none")
535 5.7.139 Authentication unsuccessful, basic authentication is disabled (encryption "tls")
```

## Causes

1. Le code utilise uniquement `AUTH LOGIN` - Microsoft peut preferer `AUTH PLAIN`
2. Microsoft Outlook necessite que SMTP AUTH soit active dans les parametres du compte
3. La methode d'authentification doit etre compatible avec les politiques de securite Microsoft

## Solution technique

### 1. Modifier `supabase/functions/_shared/email-utils.ts`

Remplacer l'authentification `AUTH LOGIN` (lignes 283-293) par une logique qui :
- Detecte les methodes d'authentification supportees via la reponse EHLO
- Essaie `AUTH PLAIN` en priorite (plus compatible avec Outlook moderne)
- Utilise `AUTH LOGIN` comme fallback si PLAIN n'est pas disponible

```text
Avant (AUTH LOGIN uniquement):
  AUTH LOGIN
  -> base64(username)
  -> base64(password)

Apres (AUTH PLAIN prioritaire):
  AUTH PLAIN base64(\0username\0password)
  Si echec -> AUTH LOGIN comme fallback
```

### 2. Modification du code d'authentification

**Lignes 266-293** - Apres le bloc EHLO/STARTTLS, ajouter :

```typescript
// Parser les capacites EHLO pour detecter les methodes AUTH supportees
const ehloLines = resp.split("\r\n");
const authLine = ehloLines.find(l => l.includes("AUTH"));
const supportsPlain = authLine?.includes("PLAIN") ?? false;
const supportsLogin = authLine?.includes("LOGIN") ?? false;

let authSuccess = false;

// Essayer AUTH PLAIN en priorite (meilleure compatibilite Outlook)
if (supportsPlain) {
  const plainCredentials = btoa(`\0${config.smtpUser}\0${config.smtpPassword}`);
  resp = await sendCmd(`AUTH PLAIN ${plainCredentials}`);
  if (resp.startsWith("235")) {
    authSuccess = true;
    console.log("[SMTP] AUTH PLAIN reussi");
  }
}

// Fallback vers AUTH LOGIN si PLAIN echoue
if (!authSuccess && supportsLogin) {
  resp = await sendCmd("AUTH LOGIN");
  if (resp.startsWith("334")) {
    resp = await sendCmd(btoa(config.smtpUser));
    if (resp.startsWith("334")) {
      resp = await sendCmd(btoa(config.smtpPassword));
      if (resp.startsWith("235")) {
        authSuccess = true;
        console.log("[SMTP] AUTH LOGIN reussi");
      }
    }
  }
}

if (!authSuccess) {
  throw new Error(`Authentification echouee. Methodes supportees: ${authLine || "inconnues"}. Verifiez que SMTP AUTH est active dans votre compte Outlook.`);
}
```

### 3. Ajouter un message d'aide pour l'utilisateur

Si l'authentification echoue malgre les deux methodes, le message d'erreur guidera l'utilisateur vers les parametres Outlook :

> "Authentification SMTP echouee. Verifiez que SMTP AUTH est active dans votre compte Outlook : Parametres > Courrier > Synchroniser le courrier > Activer POP et IMAP"

## Fichiers a modifier

| Fichier | Modification |
|---------|--------------|
| `supabase/functions/_shared/email-utils.ts` | Logique AUTH PLAIN + LOGIN avec detection automatique |

## Verification requise cote utilisateur

Apres la modification du code, si l'erreur persiste, l'utilisateur doit verifier dans son compte Outlook :

1. Aller sur [outlook.live.com](https://outlook.live.com) > Parametres > Courrier
2. Section "Synchroniser le courrier"
3. Activer "Autoriser les appareils et applications a utiliser POP"
4. Cette option active SMTP AUTH necessaire pour l'envoi d'emails

## Test de validation

Une fois le code deploye, retester avec :
- **Serveur**: smtp-mail.outlook.com
- **Port**: 587
- **Encryption**: TLS/STARTTLS
- **Utilisateur**: e2d.cmr@outlook.fr
- **Mot de passe**: cglcjtbwqmrwktcd (App Password)
