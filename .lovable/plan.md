
# Correction bug ReouvrirReunionModal + Batch 3

## Bug a corriger (Batch 2)

### ReouvrirReunionModal.tsx - ligne 49-51
Le code actuel fait :
```typescript
.update({ statut: 'paye' } as any)
```
Il faut remplacer par :
```typescript
.update({ verrouille: false })
```
La colonne `verrouille` existe bien dans la table `cotisations` (confirme dans types.ts ligne 928). Le `as any` masquait l'erreur de typage.

---

## Batch 3 : Corrections significatives

### 1. Prets - Paiement partiel logique interet/capital (#13)
**Fichier** : `src/components/PretsPaiementsManager.tsx`
- Verifier que le recalcul du capital restant apres paiement partiel ne genere pas de nouveaux interets automatiques
- Ajouter une protection contre les montants negatifs (capital restant < 0)

### 2. Notifications - Tracabilite campagnes (#14)
**Fichier** : `src/pages/admin/NotificationsAdmin.tsx`
- Enrichir l'affichage des campagnes envoyees avec statuts detailles depuis `notifications_logs`
- Ajouter colonnes : envoyes, echecs, en attente

## Section technique

| Fichier | Modification |
|---------|-------------|
| `src/components/ReouvrirReunionModal.tsx` | Fix: `.update({ verrouille: false })` au lieu de `.update({ statut: 'paye' } as any)` |
| `src/components/PretsPaiementsManager.tsx` | Verification logique interet/capital, protection montants negatifs |
| `src/pages/admin/NotificationsAdmin.tsx` | Tracabilite campagnes avec statuts detailles |
