
# Plan de nettoyage — État des lieux

## Batches 1-8 : ✅ Terminés

Logging standardisé, type safety améliorée, console.error résiduels corrigés.

## Batch 9 : ✅ Terminé

### Modifications effectuées

| # | Fichier | Action | Résultat |
|---|---------|--------|----------|
| 1 | `ReouvrirReunionModal.tsx` | `verrouille` n'existe PAS dans les types générés → cast `as any` conservé avec TODO documenté | ⚠️ Cast nécessaire |
| 2 | `NotificationToaster.tsx` | 3 `as any` remplacés par interfaces explicites (`{ echeance, statut }`, `{ montant, statut }`) | ✅ Corrigé |
| 3 | `CotisationsClotureExerciceCheck.tsx` | TODO documenté plus clairement (exercice_id manquant dans types) | ✅ Documenté |
| 4 | `BankTransferInfo.tsx` | Toast trompeur corrigé → "Fonctionnalité à venir" | ✅ Corrigé |
| 5 | `useCotisations.ts` | `as any` retiré sur insert (types compatibles) | ✅ Corrigé |

### Découverte en cours de batch

Le point 1 (ReouvrirReunionModal) révèle que le champ `verrouille` existe en base sur la table `cotisations` mais n'est pas dans les types TypeScript générés. Même problème que `exercice_id` sur `reunions`. **Action recommandée** : régénérer les types Supabase.

## Prochaines étapes possibles

- Régénérer les types Supabase pour résoudre les casts `(supabase as any)` structurels
- Chantier structurel : interfaces typées pour les requêtes jointes Supabase (~150 `as any` restants)
