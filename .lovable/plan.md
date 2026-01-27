

# Plan d'Implémentation - Gestion Multi-Services Email

## Situation Actuelle

| Élément | État |
|---------|------|
| **Configuration DB** | `email_service = "smtp"` configuré |
| **SMTP configuré** | Outlook (`smtp-mail.outlook.com`, `e2d.cmr@outlook.fr`) |
| **Resend API** | Clé configurée dans `configurations` |
| **Edge Functions** | Utilisent **uniquement Resend**, ignorent le paramètre `email_service` |

Les Edge Functions ignorent totalement le choix de l'administrateur et utilisent toujours Resend.

---

## Architecture Proposée

```text
+-------------------+     +------------------------+     +------------------+
|   EmailConfig     |---->|  email-utils.ts        |---->| Edge Functions   |
|   Manager (UI)    |     |  (logique centralisée) |     | send-email       |
+-------------------+     +------------------------+     | send-campaign    |
         |                         |                     | send-reunion-cr  |
         v                         v                     +------------------+
+-------------------+     +------------------------+
| configurations    |     | smtp_config            |
| - email_service   |     | - serveur_smtp         |
| - resend_api_key  |     | - utilisateur_smtp     |
+-------------------+     +------------------------+
```

---

## Modifications à Implémenter

### 1. Refactoriser `_shared/email-utils.ts`

Créer une fonction centrale `sendEmail()` qui gère les deux services :

```typescript
export interface FullEmailConfig {
  service: "resend" | "smtp";
  // Resend
  resendApiKey?: string;
  // SMTP
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpEncryption?: "tls" | "ssl" | "none";
  // Commun
  fromEmail: string;
  fromName: string;
  appUrl: string;
}

export async function getFullEmailConfig(): Promise<FullEmailConfig> {
  // Charge configurations + smtp_config depuis la DB
}

export async function sendEmail(config: FullEmailConfig, params: {
  to: string;
  subject: string;
  html: string;
}): Promise<{ success: boolean; error?: string }> {
  if (config.service === "resend") {
    return sendViaResend(config, params);
  } else {
    return sendViaSMTP(config, params);
  }
}
```

### 2. Implémenter l'envoi SMTP avec `denomailer`

Utiliser la bibliothèque Deno `denomailer` pour l'envoi SMTP :

```typescript
import { SMTPClient } from "https://deno.land/x/denomailer@1.6.0/mod.ts";

async function sendViaSMTP(config: FullEmailConfig, params: EmailParams) {
  const client = new SMTPClient({
    connection: {
      hostname: config.smtpHost!,
      port: config.smtpPort!,
      tls: config.smtpEncryption === "tls" || config.smtpEncryption === "ssl",
      auth: {
        username: config.smtpUser!,
        password: config.smtpPassword!,
      },
    },
  });

  await client.send({
    from: `${config.fromName} <${config.smtpUser}>`,
    to: params.to,
    subject: params.subject,
    html: params.html,
  });

  await client.close();
  return { success: true };
}
```

### 3. Modifier les Edge Functions

**Fichiers à modifier** :
- `supabase/functions/send-email/index.ts`
- `supabase/functions/send-campaign-emails/index.ts`
- `supabase/functions/send-contact-notification/index.ts`
- `supabase/functions/send-reunion-cr/index.ts`
- `supabase/functions/send-sanction-notification/index.ts`
- `supabase/functions/send-cotisation-reminders/index.ts`
- `supabase/functions/send-pret-echeance-reminders/index.ts`
- `supabase/functions/send-presence-reminders/index.ts`
- `supabase/functions/send-calendrier-beneficiaires/index.ts`

**Changement type** :
```typescript
// AVANT
const res = await fetch('https://api.resend.com/emails', { ... });

// APRÈS
import { getFullEmailConfig, sendEmail } from "../_shared/email-utils.ts";

const emailConfig = await getFullEmailConfig();
const result = await sendEmail(emailConfig, { to, subject, html });
```

### 4. Améliorer l'UI `EmailConfigManager`

Ajouter un indicateur visuel du service actif et un vrai test SMTP :

```typescript
// Appeler une nouvelle Edge Function pour tester SMTP
const testSmtpConnection = async () => {
  const { data, error } = await supabase.functions.invoke("send-email", {
    body: {
      to: smtpUser, // Envoyer à l'expéditeur lui-même
      subject: "Test SMTP E2D",
      html: "<p>Test SMTP réussi !</p>",
      forceService: "smtp" // Nouveau paramètre pour forcer le service
    },
  });
};
```

---

## Tableau Comparatif des Services

| Service | Avantages | Inconvénients |
|---------|-----------|---------------|
| **Resend API** | Simple, fiable, pas de configuration serveur | Mode test limité à 1 email ; domaine requis pour prod |
| **SMTP Outlook** | Gratuit, pas de restriction de destinataire | Limites d'envoi (~300/jour) ; possible blocage anti-spam |
| **SMTP Gmail** | Gratuit, pas de restriction | Requiert mot de passe d'application ; limites (~500/jour) |

---

## Fichiers à Créer/Modifier

| Fichier | Action | Description |
|---------|--------|-------------|
| `supabase/functions/_shared/email-utils.ts` | Modifier | Ajouter `getFullEmailConfig()` et `sendEmail()` avec support SMTP |
| `supabase/functions/send-email/index.ts` | Modifier | Utiliser `sendEmail()` centralisé |
| `supabase/functions/send-campaign-emails/index.ts` | Modifier | Utiliser `sendEmail()` centralisé |
| (+ 7 autres Edge Functions) | Modifier | Même pattern |

---

## Gestion du Changement d'Adresse Email

Pour changer d'Outlook vers Gmail :

1. **Dans l'UI** (Configuration E2D → Email) :
   - Sélectionner "SMTP Personnalisé"
   - Serveur : `smtp.gmail.com`
   - Port : `587`
   - Utilisateur : `votre-adresse@gmail.com`
   - Mot de passe : **Mot de passe d'application** (pas le mot de passe normal)
   - Encryption : TLS

2. **Pour obtenir un mot de passe d'application Gmail** :
   - Aller sur https://myaccount.google.com/security
   - Activer la validation en 2 étapes
   - Créer un mot de passe d'application : https://myaccount.google.com/apppasswords

---

## Estimation

| Tâche | Temps |
|-------|-------|
| Refactoriser `email-utils.ts` | 15 min |
| Modifier `send-email` et `send-campaign-emails` | 20 min |
| Modifier les 7 autres Edge Functions | 30 min |
| Tests et déploiement | 10 min |
| **Total** | **~1h15** |

---

## Résultat Attendu

Après implémentation :
1. L'administrateur choisit le service dans **Configuration E2D → Email**
2. Toutes les Edge Functions utilisent automatiquement le service choisi
3. Les emails Outlook/Gmail fonctionnent sans restriction de destinataire
4. Changer de service = modifier la configuration sans toucher au code

