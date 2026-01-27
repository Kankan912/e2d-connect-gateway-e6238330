

# Plan de Correction - Deux Erreurs Identifiées

## Problèmes Identifiés

### Problème 1 : Test Resend échoue encore
**Cause** : Malgré la correction du code, la version déployée de l'Edge Function `send-email` pourrait ne pas être à jour OU l'email de l'utilisateur connecté n'est pas celui du compte Resend.

**Log d'erreur** :
```
You can only send testing emails to your own email address (kankanway912@gmail.com)
```

### Problème 2 : Crash de l'onglet Notifications
**Cause** : Ligne 290 dans `NotificationsAdmin.tsx` contient un `<SelectItem value="">` avec une chaîne vide, ce qui est interdit par Radix UI.

```tsx
// ERREUR - Ligne 290
<SelectItem value="">Aucun template</SelectItem>
```

Radix UI réserve la chaîne vide (`""`) pour effacer la sélection. Il faut utiliser une valeur différente comme `"none"`.

---

## Plan de Correction

### Correction 1 : NotificationsAdmin.tsx - Select.Item vide

**Fichier** : `src/pages/admin/NotificationsAdmin.tsx`

**Modifications** :
1. Remplacer `value=""` par `value="none"` (ligne 290)
2. Adapter le `onValueChange` pour gérer `"none"` comme "pas de template"
3. Adapter la valeur initiale dans le Select pour convertir `null`/`""` en `"none"`

```tsx
// Avant
<Select
  value={config.templateId || ""}
  onValueChange={(value) => updateTriggerConfig.mutate({ 
    triggerId: trigger.id, 
    templateId: value 
  })}
>
  ...
  <SelectItem value="">Aucun template</SelectItem>

// Après
<Select
  value={config.templateId || "none"}
  onValueChange={(value) => updateTriggerConfig.mutate({ 
    triggerId: trigger.id, 
    templateId: value === "none" ? "" : value 
  })}
>
  ...
  <SelectItem value="none">Aucun template</SelectItem>
```

---

### Correction 2 : Redéployer l'Edge Function send-email

Forcer le redéploiement de `send-email` pour s'assurer que la dernière version est active.

---

## Fichiers à Modifier

| Fichier | Modification |
|---------|--------------|
| `src/pages/admin/NotificationsAdmin.tsx` | Corriger `SelectItem value=""` → `value="none"` |
| `supabase/functions/send-email/index.ts` | Redéployer la fonction |

---

## Détails Techniques

### Pourquoi le Select crash ?

Radix UI `<Select>` utilise la valeur `""` (chaîne vide) de manière spéciale :
- Quand `value=""`, le Select affiche le placeholder
- Un `SelectItem` avec `value=""` entre en conflit avec ce comportement

La solution standard est d'utiliser une valeur sentinelle comme `"none"`, `"null"`, ou `"__empty__"`.

### Exemple de code corrigé

```tsx
<Select
  value={config.templateId || "none"}
  onValueChange={(value) => updateTriggerConfig.mutate({ 
    triggerId: trigger.id, 
    templateId: value === "none" ? "" : value 
  })}
>
  <SelectTrigger className="w-[200px]">
    <SelectValue placeholder="Choisir un template" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="none">Aucun template</SelectItem>
    {templates?.map((t) => (
      <SelectItem key={t.id} value={t.id}>
        {t.nom}
      </SelectItem>
    ))}
  </SelectContent>
</Select>
```

---

## Tests de Validation

1. **Après correction du Select** :
   - Aller dans Configuration E2D → Notifications
   - La page doit s'afficher sans erreur
   - Les déclencheurs automatiques doivent être visibles

2. **Après redéploiement de send-email** :
   - Aller dans Configuration E2D → Email
   - Cliquer sur "Tester la connexion"
   - Vérifier le toast de succès et la réception de l'email

