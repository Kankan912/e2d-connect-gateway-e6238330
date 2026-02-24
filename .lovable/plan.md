

# Plan : Corriger le crash "replace" sur les templates de notification + securiser les appels fragiles

## Probleme identifie

L'erreur `Cannot read properties of undefined (reading 'replace')` se produit dans `NotificationsTemplatesAdmin.tsx` ligne 147-156. La fonction `getPreviewContent(content: string)` est appelee avec `selectedTemplate.template_sujet` ou `selectedTemplate.template_contenu`, qui peut etre `null` ou `undefined` si un template en base a des champs vides.

La previsualisation (bouton Eye) et le rendu HTML (`dangerouslySetInnerHTML`) appellent tous deux `getPreviewContent` sans guard.

## Corrections

### Fichier 1 : `src/pages/admin/NotificationsTemplatesAdmin.tsx`

**Action 1 — Securiser `getPreviewContent`** (ligne 147)

Ajouter un guard contre les valeurs nulles/undefined :

```typescript
const getPreviewContent = (content: string | null | undefined) => {
  if (!content) return '';
  return content
    .replace(/\{\{nom\}\}/g, 'DUPONT')
    // ... reste identique
};
```

**Action 2 — Securiser l'affichage du preview dialog** (lignes 478, 484)

Ajouter un fallback pour les champs potentiellement null :

```typescript
<p className="font-medium">{getPreviewContent(selectedTemplate.template_sujet || '')}</p>
// ...
dangerouslySetInnerHTML={{ __html: getPreviewContent(selectedTemplate.template_contenu || '') }}
```

### Fichier 2 : `src/components/CompteRenduViewer.tsx` (ligne 430)

Securiser le `.replace()` sur `reunion.sujet` qui peut etre null :

```typescript
const fileName = `CR_${(reunion.sujet ?? 'reunion').replace(/[^a-zA-Z0-9]/g, '_')}_${...}`;
```

### Fichier 3 : `src/pages/admin/CaisseAdmin.tsx` (ligne 520)

Deja protege par l'operateur ternaire (`op.source_table ? ... : "Manuel"`). Aucune modification.

### Fichier 4 : `src/components/Contact.tsx` (ligne 149)

`getConfigValue` retourne toujours une string — pas de risque. Aucune modification.

## Resume des fichiers modifies

| Fichier | Modification |
|---|---|
| `src/pages/admin/NotificationsTemplatesAdmin.tsx` | Guard `if (!content) return ''` dans `getPreviewContent` |
| `src/components/CompteRenduViewer.tsx` | Fallback `?? 'reunion'` avant `.replace()` sur `reunion.sujet` |

## Impact
- Corrige le crash immediat lors du clic sur un modele de notification
- Securise les autres appels `.replace()` sur des valeurs potentiellement nulles
- Aucun changement de comportement visible pour les donnees valides

