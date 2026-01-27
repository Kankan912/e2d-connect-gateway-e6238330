

# Plan de Correction Définitive - Notifications Admin

## Problème Identifié

L'erreur "Could not find a relationship between 'notifications_campagnes' and 'membres'" est causée par un **nom de contrainte incorrect** dans la requête Supabase.

| Utilisé dans le code | Nom réel dans la BDD |
|---------------------|---------------------|
| `notifications_campagnes_created_by_fkey` | `fk_notifications_campagnes_created_by` |

## Solution

### Modification Unique

**Fichier** : `src/pages/admin/NotificationsAdmin.tsx`

**Ligne 58** - Corriger le nom de la contrainte de clé étrangère :

```typescript
// AVANT (ligne 58)
createur:membres!notifications_campagnes_created_by_fkey(nom, prenom)

// APRÈS
createur:membres!fk_notifications_campagnes_created_by(nom, prenom)
```

### Code Complet de la Requête Corrigée

```typescript
const { data: campagnes, isLoading, isError, error: campagnesError } = useQuery({
  queryKey: ["notifications-campagnes"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("notifications_campagnes")
      .select(`
        *,
        createur:membres!fk_notifications_campagnes_created_by(nom, prenom)
      `)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data;
  },
});
```

## Explication Technique

Supabase PostgREST utilise les noms des contraintes de clé étrangère pour résoudre les relations entre tables. Quand on écrit :

```
membres!fk_notifications_campagnes_created_by
```

Cela signifie : "Joindre la table `membres` en utilisant la contrainte nommée `fk_notifications_campagnes_created_by`".

Si le nom de la contrainte ne correspond pas exactement, PostgREST retourne l'erreur "Could not find a relationship".

## Vérification Effectuée

La requête SQL sur `pg_constraint` confirme le nom réel :

| constraint_name | table_name | referenced_table |
|----------------|------------|------------------|
| fk_notifications_campagnes_created_by | notifications_campagnes | membres |

## Fichiers à Modifier

| Fichier | Modification |
|---------|--------------|
| `src/pages/admin/NotificationsAdmin.tsx` | Ligne 58 : Corriger le nom de la FK |

## Test de Validation

Après correction :
1. Aller dans **Configuration E2D → Notifications**
2. L'onglet **Campagnes** doit s'afficher sans erreur
3. Les 4 cartes statistiques doivent être visibles
4. Le tableau des campagnes doit afficher les données
5. La section "Déclencheurs Automatiques" doit fonctionner

## Estimation

| Tâche | Temps |
|-------|-------|
| Corriger le nom de la contrainte | 2 min |
| Test et validation | 3 min |
| **Total** | **~5 min** |

