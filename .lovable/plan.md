

# Plan : Corriger l'erreur de creation de compte et ameliorer la gestion d'erreurs

## Probleme identifie

L'erreur visible dans la capture est `"Erreur de creation - Edge Function returned a non-2xx status code"`. Les logs revelent la cause reelle : `"A user with this email address has already been registered"` (code `email_exists`, status 422).

Deux problemes distincts :

1. **Edge function `create-user-account`** (ligne 107-109) : quand `createUser` echoue avec `email_exists`, l'erreur est propagee via `throw createError` qui retourne un status 400 avec le message brut en anglais. Aucun traitement specifique pour ce cas courant.

2. **Frontend `UserMemberLinkManager`** (ligne 191-202) : `supabase.functions.invoke()` retourne `{ data, error }`. Quand l'edge function retourne un status non-2xx, le SDK met le body de la reponse dans `data` et un objet `FunctionsHttpError` generique dans `error` avec le message `"Edge Function returned a non-2xx status code"`. Le code fait `if (error) throw error` sans jamais lire `data?.error` qui contient le vrai message.

## Corrections

### Fichier 1 : `supabase/functions/create-user-account/index.ts`

**Action — Gerer `email_exists` explicitement** (lignes 107-110)

Remplacer le `throw createError` par un retour d'erreur avec message francais :

```typescript
if (createError) {
  console.error('❌ Error creating user:', createError);
  const message = (createError as any).code === 'email_exists'
    ? 'Un compte avec cet email existe déjà. Veuillez utiliser un autre email ou lier le membre au compte existant.'
    : (createError as Error).message;
  return new Response(
    JSON.stringify({ error: message }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
  );
}
```

### Fichier 2 : `src/components/UserMemberLinkManager.tsx`

**Action — Lire le message d'erreur du body de la reponse** (lignes 191-202)

Modifier le handling pour extraire le vrai message d'erreur :

```typescript
const { data, error } = await supabase.functions.invoke('create-user-account', {
  body: { ... }
});

if (error) {
  // data contient le body de la reponse avec le vrai message d'erreur
  const errorMessage = data?.error || error.message;
  throw new Error(errorMessage);
}

if (data?.error) {
  throw new Error(data.error);
}
```

## Resume des fichiers modifies

| Fichier | Modification |
|---|---|
| `supabase/functions/create-user-account/index.ts` | Message francais pour `email_exists`, retour propre au lieu de throw |
| `src/components/UserMemberLinkManager.tsx` | Extraction du vrai message d'erreur depuis `data?.error` |

## Impact
- L'utilisateur verra "Un compte avec cet email existe deja..." au lieu de "Edge Function returned a non-2xx status code"
- Les autres erreurs de creation seront aussi affichees correctement avec leur message reel
- Aucun changement de comportement pour les cas qui fonctionnent deja

