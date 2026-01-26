
# Plan de Corrections - Revue de Code Phase 1

## Résumé des Problèmes Identifiés

| Catégorie | Problème | Sévérité |
|-----------|----------|----------|
| Edge Function | `update-email-config` utilise table `utilisateurs` inexistante | CRITIQUE |
| Edge Functions | 4 fonctions utilisent encore `Deno.env.get("RESEND_API_KEY")` | HAUTE |
| Configuration | Clé `resend_api_key` absente de la table configurations | HAUTE |
| Architecture | Module partagé `email-utils.ts` non utilisé | MOYENNE |

---

## Correction 1 : Edge Function `update-email-config`

**Fichier** : `supabase/functions/update-email-config/index.ts`

**Problème** : Lignes 41-47 vérifient le rôle admin via une table `utilisateurs` qui n'existe pas.

**Solution** : Utiliser `user_roles` + `roles` comme la fonction SQL `is_admin()`.

```typescript
// REMPLACER lignes 40-52 par :
// Check if user is admin via user_roles table
const { data: userRoles } = await supabase
  .from("user_roles")
  .select("roles(name)")
  .eq("user_id", user.id);

const isAdmin = userRoles?.some((ur: any) => 
  ['administrateur', 'tresorier', 'super_admin', 'secretaire_general']
    .includes(ur.roles?.name?.toLowerCase())
);

if (!isAdmin) {
  return new Response(
    JSON.stringify({ error: "Admin access required" }),
    { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}
```

---

## Correction 2 : Edge Functions Email Non Mises à Jour

### 2.1 `send-presence-reminders/index.ts`
Ajouter fonction `getResendApiKey()` et remplacer ligne 22-34 par chargement dynamique depuis DB.

### 2.2 `send-pret-echeance-reminders/index.ts`
Même correction que 2.1.

### 2.3 `send-reunion-cr/index.ts`
Supprimer la ligne 4 (`const resend = new Resend(...)`) et charger dynamiquement dans le handler.

### 2.4 `send-sanction-notification/index.ts`
Même correction que 2.1.

**Pattern commun** :
```typescript
// Ajouter en début de fichier
async function getResendApiKey(supabase: any): Promise<string> {
  const { data } = await supabase
    .from("configurations")
    .select("valeur")
    .eq("cle", "resend_api_key")
    .single();
  return data?.valeur || Deno.env.get("RESEND_API_KEY") || "";
}

// Dans le handler
const resendApiKey = await getResendApiKey(supabase);
if (!resendApiKey) {
  return new Response(
    JSON.stringify({ 
      error: "Clé API Resend non configurée. Configuration → Email." 
    }),
    { status: 500, headers: corsHeaders }
  );
}
const resend = new Resend(resendApiKey);
```

---

## Correction 3 : Entrée Configuration par Défaut

**Migration SQL** :
```sql
INSERT INTO configurations (cle, valeur, description)
VALUES (
  'resend_api_key', 
  '', 
  'Clé API Resend pour envoi emails (à configurer via UI)'
)
ON CONFLICT (cle) DO NOTHING;
```

---

## Correction 4 : Unification Module Partagé (Optionnel)

Le fichier `supabase/functions/_shared/email-utils.ts` existe mais n'est importé nulle part.

**Option recommandée** : Pour l'instant, conserver les fonctions locales dans chaque edge function (plus simple à déployer). Dans une future refactorisation, centraliser dans le module partagé.

---

## Fichiers à Modifier

| Fichier | Modifications |
|---------|---------------|
| `supabase/functions/update-email-config/index.ts` | Corriger vérification admin |
| `supabase/functions/send-presence-reminders/index.ts` | Ajouter chargement clé depuis DB |
| `supabase/functions/send-pret-echeance-reminders/index.ts` | Ajouter chargement clé depuis DB |
| `supabase/functions/send-reunion-cr/index.ts` | Ajouter chargement clé depuis DB |
| `supabase/functions/send-sanction-notification/index.ts` | Ajouter chargement clé depuis DB |

**Migration SQL** : Insérer entrée `resend_api_key` par défaut

---

## Estimation

| Tâche | Durée |
|-------|-------|
| Correction `update-email-config` | 15 min |
| Mise à jour 4 edge functions | 30 min |
| Migration SQL | 5 min |
| Test et déploiement | 15 min |
| **Total** | **~1h** |

---

## Tests de Validation

1. **Test sauvegarde clé API** : Saisir une clé dans l'UI Email Config → Vérifier que `configurations.resend_api_key` est peuplé
2. **Test envoi email** : Déclencher un email de test via l'UI
3. **Vérifier logs** : Aucune erreur "RESEND_API_KEY non configurée" dans les logs edge functions
