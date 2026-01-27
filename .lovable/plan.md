

# Plan de Correction Définitive - Envoi d'Emails de Campagne

## Problème Identifié

L'Edge Function `send-campaign-emails` ne trouve aucun destinataire car :

| Ce que contient la DB | Ce que le code attend |
|----------------------|----------------------|
| `["uuid1", "uuid2", ...]` (tableau) | `{ type: "all" \| "selected", ids: ["..."] }` (objet) |

Les logs confirment : `📬 Found 0 recipients`

Les campagnes existantes ont 7 destinataires stockés directement comme un tableau d'IDs :
```json
["f9b3b4ea-...", "0fc66f31-...", "c44fdebc-...", ...]
```

Mais le code de l'Edge Function fait :
```typescript
const destinataires = campaign.destinataires as { type: string; ids?: string[] };
if (destinataires.type === "all") { ... }  // ❌ undefined
```

---

## Solution

Adapter l'Edge Function pour gérer **les deux formats** :
1. **Format tableau** (données existantes) : `["uuid1", "uuid2", ...]`
2. **Format objet** (nouveau format prévu) : `{ type: "all" | "selected", ids: [] }`

### Modification de l'Edge Function

**Fichier** : `supabase/functions/send-campaign-emails/index.ts`

**Avant** (lignes 112-130) :
```typescript
let recipients: { id: string; email: string; nom: string; prenom: string }[] = [];
const destinataires = campaign.destinataires as { type: string; ids?: string[] };

if (destinataires.type === "all") {
  const { data: membres } = await supabaseAdmin
    .from("membres")
    .select("id, email, nom, prenom")
    .not("email", "is", null)
    .eq("statut", "actif");
  recipients = membres || [];
} else if (destinataires.type === "selected" && destinataires.ids) {
  const { data: membres } = await supabaseAdmin
    .from("membres")
    .select("id, email, nom, prenom")
    .in("id", destinataires.ids)
    .not("email", "is", null);
  recipients = membres || [];
}
```

**Après** :
```typescript
let recipients: { id: string; email: string; nom: string; prenom: string }[] = [];
const destinatairesRaw = campaign.destinataires;

// Gestion des deux formats : tableau direct d'IDs ou objet { type, ids }
if (Array.isArray(destinatairesRaw)) {
  // Format: ["uuid1", "uuid2", ...] - tableau direct d'IDs membres
  if (destinatairesRaw.length > 0) {
    const { data: membres } = await supabaseAdmin
      .from("membres")
      .select("id, email, nom, prenom")
      .in("id", destinatairesRaw)
      .not("email", "is", null);
    recipients = membres || [];
  } else {
    // Tableau vide = tous les membres actifs
    const { data: membres } = await supabaseAdmin
      .from("membres")
      .select("id, email, nom, prenom")
      .not("email", "is", null)
      .eq("statut", "actif");
    recipients = membres || [];
  }
} else if (typeof destinatairesRaw === "object" && destinatairesRaw !== null) {
  // Format objet: { type: "all" | "selected", ids?: [] }
  const destinataires = destinatairesRaw as { type?: string; ids?: string[] };
  
  if (destinataires.type === "all") {
    const { data: membres } = await supabaseAdmin
      .from("membres")
      .select("id, email, nom, prenom")
      .not("email", "is", null)
      .eq("statut", "actif");
    recipients = membres || [];
  } else if (destinataires.type === "selected" && destinataires.ids?.length) {
    const { data: membres } = await supabaseAdmin
      .from("membres")
      .select("id, email, nom, prenom")
      .in("id", destinataires.ids)
      .not("email", "is", null);
    recipients = membres || [];
  }
}

console.log(`📬 Found ${recipients.length} recipients from format: ${Array.isArray(destinatairesRaw) ? "array" : "object"}`);
```

---

## Important : Restriction du Mode Test Resend

En mode test Resend (sans domaine vérifié), les emails ne peuvent être envoyés qu'à l'adresse du propriétaire du compte : `kankanway912@gmail.com`.

Les 7 destinataires de la campagne ont ces emails :
- `alexr.fotso@gmail.com` ❌
- `nanafranck96@gmail.com` ❌
- `zpekinho@gmail.com` ❌
- `admin@e2d.com` ❌
- `kankanway912@gmail.com` ✅ (seul email autorisé)
- `toto@guillaume.com` ❌
- `patrick@gmail.com` ❌

**Seul 1 email sur 7 sera envoyé avec succès** tant qu'un domaine n'est pas vérifié sur Resend.

---

## Fichiers à Modifier

| Fichier | Modification |
|---------|--------------|
| `supabase/functions/send-campaign-emails/index.ts` | Gérer le format tableau ET objet pour `destinataires` |

---

## Tests de Validation

1. Après déploiement de l'Edge Function :
   - Aller dans **Configuration E2D → Notifications**
   - Cliquer sur l'icône d'envoi ✈️ pour la campagne "Rappel réunion"
   - Vérifier les logs : `📬 Found 7 recipients from format: array`
   - Résultat attendu : **1 email envoyé** (kankanway912@gmail.com), **6 erreurs** (emails non autorisés en mode test)

2. Pour envoyer à tous les membres :
   - **Vérifier un domaine** sur https://resend.com/domains
   - Mettre à jour l'adresse `from` dans l'Edge Function avec le domaine vérifié

---

## Prochaine Étape Recommandée

Améliorer le formulaire de création de campagne pour permettre la sélection des destinataires :
- Ajouter un sélecteur "Tous les membres" / "Sélection personnalisée"
- Ajouter une liste de cases à cocher pour sélectionner les membres
- Stocker au format objet `{ type, ids }` pour cohérence future

