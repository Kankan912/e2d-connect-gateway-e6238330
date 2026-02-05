
# Correction SMTP Outlook - Port 587 STARTTLS

## Diagnostic

**Problème identifié** : La bibliothèque `denomailer` ne gère pas correctement le protocole STARTTLS avec les serveurs Outlook/Office365. Deno (via `rustls`) est très strict sur la négociation TLS et échoue avec l'erreur "InvalidContentType".

**Configuration actuelle** :
| Paramètre | Valeur |
|-----------|--------|
| Serveur | smtp-mail.outlook.com |
| Port | 587 |
| Encryption | TLS (STARTTLS) |
| Utilisateur | e2d.cmr@outlook.fr |

## Solution

Utiliser `nodemailer` (plus mature et compatible Outlook) avec les polyfills Node.js nécessaires pour Deno.

## Fichier a Modifier

`supabase/functions/_shared/email-utils.ts`

## Changements Techniques

### 1. Remplacer les imports (lignes 1-2)

**Avant** :
```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";
```

**Apres** :
```typescript
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// Polyfills Node.js pour nodemailer dans Deno
import { Buffer } from "node:buffer";
import process from "node:process";

// Injecter dans le scope global
// @ts-ignore
if (typeof globalThis.Buffer === "undefined") globalThis.Buffer = Buffer;
// @ts-ignore
if (typeof globalThis.process === "undefined") globalThis.process = process;

import nodemailer from "npm:nodemailer@6.9.9";
```

### 2. Reecrire la fonction sendViaSMTP (lignes 200-268)

```typescript
async function sendViaSMTP(config: FullEmailConfig, params: EmailParams): Promise<EmailResult> {
  if (!config.smtpHost || !config.smtpUser || !config.smtpPassword) {
    return { 
      success: false, 
      error: "Configuration SMTP incomplete." 
    };
  }

  try {
    const port = config.smtpPort || 587;
    const isSecure = port === 465 || config.smtpEncryption === "ssl";
    
    console.log(`[SMTP] Connexion a ${config.smtpHost}:${port} (secure: ${isSecure})...`);
    
    const transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: port,
      secure: isSecure, // true pour 465, false pour 587
      auth: {
        user: config.smtpUser,
        pass: config.smtpPassword,
      },
      // Configuration TLS pour Outlook
      tls: {
        ciphers: "SSLv3",
        rejectUnauthorized: false,
      },
      // Force STARTTLS pour port 587
      requireTLS: !isSecure && config.smtpEncryption === "tls",
    });

    const info = await transporter.sendMail({
      from: `"${config.fromName}" <${config.smtpUser}>`,
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text || "",
    });

    console.log(`[SMTP] Email envoye a ${params.to}, messageId: ${info.messageId}`);
    return { success: true, data: { messageId: info.messageId } };
  } catch (error: any) {
    console.error("[SMTP] Erreur d'envoi:", error);
    return { 
      success: false, 
      error: `Erreur SMTP: ${error.message}` 
    };
  }
}
```

## Pourquoi ca va fonctionner

1. **nodemailer** : Bibliotheque mature qui gere correctement les specificites d'Outlook (delais EHLO, negociation STARTTLS)
2. **Polyfills** : Les imports `node:buffer` et `node:process` sont supportes nativement par Deno et resolvent l'erreur "Buffer is not defined"
3. **Configuration TLS** : Les options `ciphers: "SSLv3"` et `requireTLS` assurent une negociation compatible

## Edge Functions a Redeployer

Apres modification de `email-utils.ts`, redeployer :
- `send-email`
- `send-campaign-emails`
- `send-calendrier-beneficiaires`
- `send-contact-notification`
- `send-cotisation-reminders`
- `send-presence-reminders`
- `send-pret-echeance-reminders`
- `send-reunion-cr`
- `send-sanction-notification`

## Test de Validation

Apres deploiement, tester via Configuration → Email → "Tester la connexion SMTP"
