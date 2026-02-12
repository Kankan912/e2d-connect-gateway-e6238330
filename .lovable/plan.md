

# Batch 4 : Travaux structurels - Qualite, coherence et performance

## Analyse des problemes identifies

Apres revue approfondie du code, voici les axes d'amelioration structurels identifies :

---

## 1. Duplication calcul Caisse : `useCaisseStats` vs `useCaisseSynthese`

**Probleme** : Deux hooks font essentiellement le meme travail (calculer le solde global et les totaux depuis `fond_caisse_operations`) avec des approches differentes :
- `useCaisseStats` (dans `useCaisse.ts`) : s'appuie sur le resultat de `useCaisseOperations()` (hook dependant)
- `useCaisseSynthese` : requete directe independante avec plus de categories

**Action** : Refactoriser `useCaisseStats` pour reutiliser `useCaisseSynthese` au lieu de dupliquer les calculs. Le hook `useCaisseStats` deviendra un wrapper leger qui extrait les champs necessaires de `useCaisseSynthese`.

### Fichier : `src/hooks/useCaisse.ts`
- Supprimer la logique de calcul dupliquee dans `useCaisseStats`
- Importer et reutiliser `useCaisseSynthese` comme source de donnees
- Conserver l'interface `CaisseStats` pour compatibilite mais la deriver de `CaisseSynthese`

---

## 2. Nettoyage des `as any` non necessaires

**Probleme** : 72+ occurrences de `as any` dans les composants, dont certaines masquent de vrais problemes de typage.

**Action** : Corriger les plus critiques (ceux dans la logique metier, pas ceux lies aux types Supabase auto-generes) :

| Fichier | Correction |
|---------|-----------|
| `src/components/forms/ReunionForm.tsx` | Typer correctement `reunionData` au lieu de `as any` |
| `src/components/forms/MemberForm.tsx` | Typer `cleanedData` avec le type `Partial<Member>` |
| `src/components/PretsPaiementsManager.tsx` | Typer `typePaiement` proprement |

Les `as any` sur les appels Supabase (comme `verrouille` qui existe en DB mais pas dans les types TS generes) sont acceptables et documentes.

---

## 3. Protection contre la limite de 1000 lignes Supabase

**Probleme** : Plusieurs hooks font des requetes sans limite explicite sur des tables potentiellement volumineuses (`fond_caisse_operations`, `cotisations`, `epargnes`). La limite par defaut de Supabase est 1000 lignes.

**Action** : Ajouter une pagination ou un avertissement dans les hooks critiques :

| Hook | Table | Action |
|------|-------|--------|
| `useCaisseSynthese` | `fond_caisse_operations` | Utiliser `.select('montant, type_operation, categorie')` + pagination par blocs de 1000 |
| `useAlertesGlobales` | `fond_caisse_operations` | Idem - le calcul du solde sera faux si > 1000 operations |
| `useAllCotisations` | `cotisations` | Ajouter `.limit(1000)` avec un commentaire d'avertissement |

---

## 4. Coherence des invalidations de cache React Query

**Probleme** : Certains hooks invalident des cles de cache que d'autres hooks n'ecoutent pas, ou oublient d'invalider des cles dependantes.

**Action** : Standardiser les invalidations :

| Mutation | Cles manquantes a invalider |
|----------|---------------------------|
| `useCreateEpargne` | Ajouter `caisse-operations`, `caisse-synthese` |
| `useCreateCotisation` | Ajouter `caisse-operations`, `caisse-synthese`, `cotisations-reunion` |
| `useUpdateCotisation` | Ajouter `caisse-synthese`, `cotisations-reunion` |
| `useDeleteCotisation` | Ajouter `caisse-synthese` |

---

## 5. `AdminRoute` : mapping de roles incomplet

**Probleme** : `AdminRoute` a un `roleMapping` qui ne couvre pas tous les roles du systeme. Les roles `responsable_sportif`, `censeur`, `commissaire_aux_comptes` sont absents du mapping et des `allowedRoles` par defaut.

**Action** : Completer le mapping et documenter les roles :

```text
Roles systeme : administrateur, tresorier, secretaire_general, 
                super_admin, responsable_sportif, censeur, 
                commissaire_aux_comptes, membre
```

Ajouter `super_admin` et `secretaire_general` aux `allowedRoles` par defaut de `AdminRoute`, coherent avec la fonction SQL `is_admin()`.

---

## Resume des fichiers a modifier

| # | Fichier | Nature |
|---|---------|--------|
| 1 | `src/hooks/useCaisse.ts` | Refactoriser `useCaisseStats` pour reutiliser `useCaisseSynthese` |
| 2 | `src/components/forms/ReunionForm.tsx` | Supprimer `as any` sur `reunionData` |
| 3 | `src/components/forms/MemberForm.tsx` | Supprimer `as any` sur `cleanedData` |
| 4 | `src/hooks/useCaisseSynthese.ts` | Ajouter pagination pour depasser la limite de 1000 lignes |
| 5 | `src/hooks/useAlertesGlobales.ts` | Ajouter pagination sur le calcul du solde caisse |
| 6 | `src/hooks/useCotisations.ts` | Ajouter invalidations de cache manquantes |
| 7 | `src/hooks/useEpargnes.ts` | Ajouter invalidations de cache manquantes |
| 8 | `src/components/auth/AdminRoute.tsx` | Completer les `allowedRoles` par defaut avec `super_admin` et `secretaire_general` |

## Impact

- Aucun changement de comportement visible pour l'utilisateur
- Meilleure fiabilite des calculs financiers (pagination)
- Coherence du cache apres mutations
- Code plus maintenable (moins de duplication, moins de `as any`)

