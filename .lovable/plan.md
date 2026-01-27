

# Plan d'Action Multi-Phases - Correction des Manquements

## Vue d'Ensemble

Ce plan couvre la correction de **22 points** identifiés dans l'analyse, organisés en 4 phases selon leur priorité et complexité.

---

## Phase 1 : Corrections Critiques (1h30)

### 1.1 Message "Montant Partagé" Incorrect

**Fichier** : `src/components/config/CalendrierBeneficiairesManager.tsx`

**Action** : Reformuler le message d'alerte lors de l'ajout d'un bénéficiaire sur un mois déjà occupé.

**Avant** :
```
"Le montant sera partagé entre les bénéficiaires"
```

**Après** :
```
"Plusieurs bénéficiaires ce mois : chacun recevra sa cotisation × 12 (paiements indépendants)"
```

---

### 1.2 Affichage Médias sur EventDetail

**Fichier** : `src/pages/EventDetail.tsx`

**Actions** :
1. Requêter `match_medias` via `match_id` lié à l'événement
2. Afficher une galerie photos/vidéos sous les détails du match
3. Utiliser le composant `LazyImage` existant pour les performances

**Code à ajouter** :
```typescript
// Charger les médias du match
const { data: matchMedias } = useQuery({
  queryKey: ['match-medias', event?.match_id],
  queryFn: async () => {
    if (!event?.match_id) return [];
    const { data } = await supabase
      .from('match_medias')
      .select('*')
      .eq('match_id', event.match_id);
    return data || [];
  },
  enabled: !!event?.match_id
});
```

---

## Phase 2 : Améliorations Importantes (2h)

### 2.1 Drag-and-Drop Bénéficiaires

**Fichier** : `src/components/config/CalendrierBeneficiairesManager.tsx`

**Actions** :
1. Installer `@dnd-kit/core` et `@dnd-kit/sortable`
2. Wrapper la liste avec `DndContext` et `SortableContext`
3. Remplacer l'icône `GripVertical` statique par un handle draggable
4. Appeler `reorderBeneficiaires` mutation sur `onDragEnd`

**Structure** :
```typescript
import { DndContext, closestCenter } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';

// Composant SortableRow pour chaque bénéficiaire
const SortableRow = ({ beneficiaire }) => {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: beneficiaire.id
  });
  // ...
};
```

---

### 2.2 Pagination "Charger Plus" pour Événements/Matchs

**Fichiers** :
- `src/pages/Sport.tsx`
- `src/pages/SportE2D.tsx`
- `src/pages/SportPhoenix.tsx`

**Actions** :
1. Supprimer les `.limit(5)` ou `.limit(10)` hardcodés
2. Implémenter un état `displayCount` avec valeur initiale 10
3. Ajouter un bouton "Charger plus" qui incrémente de 10
4. Utiliser `useInfiniteQuery` ou pagination simple

**Code type** :
```typescript
const [displayCount, setDisplayCount] = useState(10);

// Dans le JSX
{matchs.slice(0, displayCount).map(match => ...)}

{displayCount < matchs.length && (
  <Button onClick={() => setDisplayCount(prev => prev + 10)}>
    Charger plus ({matchs.length - displayCount} restants)
  </Button>
)}
```

---

### 2.3 Calcul Dynamique "Reste à Payer" Cotisations

**Fichier** : `src/components/CotisationCellModal.tsx`

**Actions** :
1. Utiliser `useMemo` pour recalculer le reste à payer à chaque saisie
2. Afficher un indicateur visuel temps réel (badge coloré)
3. Désactiver le bouton de paiement si montant > reste

**Code** :
```typescript
const resteAPayer = useMemo(() => {
  const totalPaye = paiements.reduce((sum, p) => sum + p.montant, 0);
  return Math.max(0, montantDu - totalPaye - nouveauMontant);
}, [paiements, montantDu, nouveauMontant]);
```

---

## Phase 3 : Vérifications et Corrections Modérées (1h30)

### 3.1 Notifications Sans Clôture Réunion

**Fichiers** :
- `src/components/NotifierReunionModal.tsx`
- `supabase/functions/send-reunion-cr/index.ts`

**Actions** :
1. Vérifier que le bouton "Notifier" est accessible même si `statut !== 'cloturee'`
2. Adapter le template email pour distinguer "rappel" vs "compte-rendu"
3. Ajouter un paramètre `type: 'rappel' | 'compte_rendu'` à l'Edge Function

---

### 3.2 Logique Intérêts/Reconduction Prêts

**Fichiers** :
- `src/hooks/usePrets.ts` (ou équivalent)
- `src/pages/admin/PretsAdmin.tsx`

**Actions** :
1. Vérifier que `calculate_total_pret_amount` SQL est appelé correctement
2. Afficher clairement : Montant initial + Intérêts + Reconductions
3. Recalculer automatiquement lors d'une reconduction

**Formule attendue** :
```
Total = Montant × (1 + taux/100) × (1 + nb_reconductions)
```

---

### 3.3 Export PDF Calendrier Bénéficiaires avec Logo

**Fichier** : `src/components/config/CalendrierBeneficiairesManager.tsx`

**Actions** :
1. Vérifier que `jspdf` charge bien le logo E2D
2. Positionner le logo en haut à gauche du PDF
3. Ajuster les marges pour ne pas chevaucher le tableau

---

## Phase 4 : Nettoyage et Finalisation (45min)

### 4.1 Audit Log Réouverture Réunion

**Fichiers** :
- `src/components/ReouvrirReunionModal.tsx`
- Table `audit_logs` (à créer si inexistante)

**Actions** :
1. Logger chaque réouverture avec : `user_id`, `reunion_id`, `raison`, `timestamp`
2. Afficher l'historique dans le détail de la réunion

---

### 4.2 Synchronisation Complète Sport → Site

**Fichier** : `src/lib/sync-events.ts`

**Actions** :
1. Vérifier que `syncAllSportEventsToWebsite({ includeAll: true })` inclut bien les matchs passés
2. S'assurer que les scores sont affichés sur le site public

---

### 4.3 Test Final Multi-Services Email

**Actions** :
1. Tester envoi via SMTP Outlook
2. Tester envoi via Resend API
3. Vérifier basculement automatique selon config DB
4. Confirmer réception des emails de test

---

## Récapitulatif par Phase

| Phase | Durée | Nombre de corrections |
|-------|-------|----------------------|
| Phase 1 - Critiques | 1h30 | 2 |
| Phase 2 - Importantes | 2h00 | 3 |
| Phase 3 - Modérées | 1h30 | 3 |
| Phase 4 - Finalisation | 0h45 | 3 |
| **Total** | **5h45** | **11 corrections** |

Les 11 autres points de l'analyse étaient soit déjà corrigés, soit fonctionnels, soit des comportements acceptables.

---

## Dépendances à Installer

```bash
npm install @dnd-kit/core @dnd-kit/sortable
```

---

## Ordre d'Exécution Recommandé

1. **Phase 1.1** → Message bénéficiaires (5 min)
2. **Phase 1.2** → Médias EventDetail (25 min)
3. **Phase 2.1** → Drag-and-drop (45 min)
4. **Phase 2.2** → Pagination événements (30 min)
5. **Phase 2.3** → Calcul dynamique cotisations (20 min)
6. **Phase 3.1** → Notifications réunion (30 min)
7. **Phase 3.2** → Logique prêts (30 min)
8. **Phase 3.3** → PDF logo (15 min)
9. **Phase 4.1** → Audit log (20 min)
10. **Phase 4.2** → Sync sport (15 min)
11. **Phase 4.3** → Test emails (10 min)

