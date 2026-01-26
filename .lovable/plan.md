
# Plan d'implémentation - Phase 2 : Priorité Haute (3h)

## Résumé de l'Analyse

### Ce qui est déjà bien implémenté :
1. **Synchronisation E2D → Site** : Entièrement fonctionnelle
   - `useCreateE2DMatch` synchronise automatiquement si `statut_publication === 'publie'`
   - `useUpdateE2DMatch` synchronise ou retire selon le statut
   - `useDeleteE2DMatch` retire du site avant suppression
   - `useSportEventSync` écoute les changements en temps réel
   - Bouton "Synchroniser site" déjà présent dans `SportE2D.tsx` (ligne 176-186)

2. **Configuration types cotisation par exercice** : Interface fonctionnelle
   - `ExercicesCotisationsTypesManager.tsx` permet d'activer/désactiver les types par exercice
   - Toggle Switch pour chaque type avec badge Actif/Inactif

3. **Montants mensuels individuels** : Interface complète
   - `CotisationsMensuellesExerciceManager.tsx` (580 lignes)
   - Saisie par membre, application en masse, verrouillage après exercice actif
   - Audit des modifications pour exercices verrouillés

4. **Multi-bénéficiaires par mois** : Partiellement implémenté
   - Le hook `useCalendrierBeneficiaires` supporte plusieurs bénéficiaires
   - La dialog d'ajout affiche le nombre de bénéficiaires par mois

### Ce qui nécessite des améliorations :

| Point | État Actuel | Amélioration Requise |
|-------|-------------|----------------------|
| Types cotisation exercice | Ne charge que les exercices actifs | Charger tous les exercices (planifiés inclus) |
| Types cotisation exercice | Pas de bouton "Initialiser obligatoires" | Ajouter bouton d'initialisation rapide |
| Multi-bénéficiaires | Pas d'affichage de l'ordre dans le mois | Ajouter colonne "Ordre mois" |
| Multi-bénéficiaires | Pas de drag & drop pour réordonner | Amélioration UX future (hors périmètre) |

---

## Corrections à Implémenter

### 2.1 Améliorer ExercicesCotisationsTypesManager

**Fichier** : `src/components/config/ExercicesCotisationsTypesManager.tsx`

**Modifications** :

1. **Charger TOUS les exercices** (pas seulement les actifs) :
```typescript
// Ligne 22-30 : Modifier la requête
const { data: exercices, isLoading: loadingExercices } = useQuery({
  queryKey: ["exercices-config-types"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("exercices")
      .select("id, nom, statut")
      .in("statut", ["planifie", "actif"]) // Inclure planifiés
      .order("date_debut", { ascending: false });
    
    if (error) throw error;
    return data;
  },
});
```

2. **Ajouter bouton "Initialiser les types obligatoires"** :
```typescript
// Ajouter après le sélecteur d'exercice (ligne 150)
{selectedExerciceId && (
  <Button 
    variant="outline" 
    size="sm"
    onClick={handleInitializeObligatoires}
    disabled={initMutation.isPending}
  >
    <Wand2 className="h-4 w-4 mr-2" />
    Initialiser types obligatoires
  </Button>
)}
```

3. **Mutation pour initialiser les types obligatoires** :
```typescript
const initMutation = useMutation({
  mutationFn: async () => {
    const obligatoires = typesCotisations?.filter(t => t.obligatoire) || [];
    for (const type of obligatoires) {
      const existing = associations?.find(a => a.type_cotisation_id === type.id);
      if (!existing) {
        await supabase.from("exercices_cotisations_types").insert({
          exercice_id: selectedExerciceId,
          type_cotisation_id: type.id,
          actif: true
        });
      } else if (!existing.actif) {
        await supabase.from("exercices_cotisations_types")
          .update({ actif: true })
          .eq("id", existing.id);
      }
    }
  },
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ["exercices-cotisations-types", selectedExerciceId] });
    toast({ title: "Types obligatoires activés" });
  }
});
```

4. **Avertissement si exercice actif** :
```typescript
// Ajouter après le sélecteur (dans le JSX)
{selectedExercice?.statut === 'actif' && (
  <Alert className="mt-2">
    <AlertCircle className="h-4 w-4" />
    <AlertDescription>
      Cet exercice est <strong>actif</strong>. Les modifications sont possibles mais 
      affecteront les calculs de cotisations en cours.
    </AlertDescription>
  </Alert>
)}
```

---

### 2.2 Améliorer CalendrierBeneficiairesManager

**Fichier** : `src/components/config/CalendrierBeneficiairesManager.tsx`

**Modifications** :

1. **Afficher l'ordre dans le mois** pour les multi-bénéficiaires :
```typescript
// Dans le TableRow (ligne 341-386), après la colonne "Mois"
<TableCell>
  {b.mois_benefice ? (
    <div className="flex items-center gap-2">
      <Badge>{MOIS[b.mois_benefice - 1]}</Badge>
      {/* Afficher l'ordre si plusieurs bénéficiaires sur le même mois */}
      {calendrier.filter(c => c.mois_benefice === b.mois_benefice).length > 1 && (
        <Badge variant="outline" className="text-xs">
          {calendrier.filter(c => c.mois_benefice === b.mois_benefice && c.rang <= b.rang).length}
          /{calendrier.filter(c => c.mois_benefice === b.mois_benefice).length}
        </Badge>
      )}
    </div>
  ) : (
    <span className="text-muted-foreground">-</span>
  )}
</TableCell>
```

2. **Calculer le montant individuel** (divisé par le nombre de bénéficiaires du mois) :
```typescript
// Dans le calcul du montant total affiché (optionnel, à activer si souhaité)
const getMontantIndividuel = (beneficiaire: CalendrierBeneficiaire) => {
  const nbBeneficiairesMois = calendrier.filter(
    c => c.mois_benefice === beneficiaire.mois_benefice
  ).length;
  return nbBeneficiairesMois > 1 
    ? beneficiaire.montant_total / nbBeneficiairesMois 
    : beneficiaire.montant_total;
};
```

3. **Améliorer le feedback dans la dialog d'ajout** :
```typescript
// Ajouter une info-bulle après la sélection du mois (ligne 442-444)
<p className="text-xs text-muted-foreground mt-1">
  {calendrier.filter(c => c.mois_benefice === parseInt(selectedMois)).length > 0 ? (
    <span className="text-amber-600">
      ⚠️ Ce mois a déjà {calendrier.filter(c => c.mois_benefice === parseInt(selectedMois)).length} bénéficiaire(s). 
      Le montant sera partagé.
    </span>
  ) : (
    "Ce sera le seul bénéficiaire de ce mois."
  )}
</p>
```

---

## Fichiers à Modifier

| Fichier | Modifications |
|---------|---------------|
| `src/components/config/ExercicesCotisationsTypesManager.tsx` | Charger tous exercices, bouton init obligatoires, avertissement |
| `src/components/config/CalendrierBeneficiairesManager.tsx` | Afficher ordre mois, calcul montant individuel, feedback dialog |

---

## Éléments Déjà Fonctionnels (Pas de Modification)

Les éléments suivants sont déjà correctement implémentés et ne nécessitent aucune modification :

1. **Synchronisation E2D → Site Web** :
   - `src/hooks/useSport.ts` : Appels automatiques à `syncE2DMatchToEvent`
   - `src/hooks/useSportEventSync.ts` : Écoute temps réel
   - `src/pages/SportE2D.tsx` : Bouton "Synchroniser site" avec compteur

2. **Montants mensuels par membre** :
   - `src/components/config/CotisationsMensuellesExerciceManager.tsx` : Interface complète
   - Bulk-edit, verrouillage, audit

3. **Hook calendrier bénéficiaires** :
   - `src/hooks/useCalendrierBeneficiaires.ts` : Supporte déjà multi-bénéficiaires

---

## Estimation Révisée

| Tâche | Temps |
|-------|-------|
| Améliorer ExercicesCotisationsTypesManager | 45 min |
| Améliorer CalendrierBeneficiairesManager | 45 min |
| Tests et vérifications | 30 min |
| **Total Phase 2** | **~2h** |

---

## Tests de Validation

1. **Types cotisation par exercice** :
   - Sélectionner un exercice planifié → Vérifier affichage
   - Cliquer "Initialiser types obligatoires" → Vérifier activation
   - Sélectionner exercice actif → Vérifier message d'avertissement

2. **Multi-bénéficiaires** :
   - Ajouter 2 bénéficiaires sur le même mois
   - Vérifier affichage de l'ordre (1/2, 2/2)
   - Vérifier le message d'avertissement dans la dialog

3. **Synchronisation E2D** (déjà fonctionnel) :
   - Créer un match avec statut "Publié" → Vérifier apparition sur `/` (événements)
   - Modifier le statut en "Brouillon" → Vérifier retrait du site
