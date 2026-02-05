
# Plan de correction : Sauvegarde du mot de passe SMTP

## Probleme identifie

L'operation `.update()` de Supabase reussit au niveau API mais n'affecte aucune ligne car les politiques RLS (Row Level Security) sur la table `smtp_config` bloquent silencieusement la mise a jour. Le code ne detecte pas cet echec.

**Preuve :**
- Timestamp `updated_at` dans la base : `2025-10-30` (jamais mis a jour depuis)
- Mot de passe actuel en base : `cigpihevjbrmccgh` (ancien mot de passe)
- L'Edge Function continue d'utiliser l'ancien mot de passe

## Solution proposee

Modifier `EmailConfigManager.tsx` pour utiliser `.select()` apres l'update afin de verifier que la mise a jour a fonctionne, et afficher une erreur claire si ce n'est pas le cas.

## Modifications techniques

### Fichier : `src/components/config/EmailConfigManager.tsx`

**Lignes 238-248 - Fonction `testSmtpConnection()`**

Remplacer :
```typescript
const { error: saveError } = await supabase
  .from("smtp_config")
  .update(smtpData)
  .eq("id", smtpConfigId);
if (saveError) throw new Error("Erreur sauvegarde config: " + saveError.message);
```

Par :
```typescript
const { data: updatedData, error: saveError } = await supabase
  .from("smtp_config")
  .update(smtpData)
  .eq("id", smtpConfigId)
  .select();

if (saveError) {
  throw new Error("Erreur sauvegarde config: " + saveError.message);
}

// Verifier que la mise a jour a affecte au moins une ligne
if (!updatedData || updatedData.length === 0) {
  throw new Error("Echec de la sauvegarde : verifiez vos permissions administrateur ou rafraichissez la page");
}
```

**Lignes 121-126 - Fonction `saveConfigMutation`**

Appliquer la meme correction pour la sauvegarde generale :
```typescript
const { data: updatedSmtp, error } = await supabase
  .from("smtp_config")
  .update(smtpData)
  .eq("id", smtpConfigId)
  .select();

if (error) throw error;
if (!updatedSmtp || updatedSmtp.length === 0) {
  throw new Error("Echec de la mise a jour SMTP : permissions insuffisantes");
}
```

## Resultat attendu

- Si la mise a jour echoue a cause des permissions RLS, l'utilisateur verra un message d'erreur clair au lieu d'un faux succes
- Le diagnostic sera plus facile car on saura exactement si le probleme vient des permissions ou d'autre chose
- L'utilisateur pourra contacter l'administrateur ou rafraichir sa session si necessaire
