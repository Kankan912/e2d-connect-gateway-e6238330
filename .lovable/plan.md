

# Plan de correction des manquements - Modules Aides et Fonds de Caisse

## Resume des manquements identifies

Votre fichier liste **16 problemes** repartis sur 2 modules :
- **Aides** : 6 problemes (3 critiques, 1 haute, 1 moyenne, 1 critique permissions)
- **Fonds de Caisse** : 10 problemes (6 critiques, 2 hautes, 2 moyennes)

---

## Phase 1 : Module Aides (6 corrections)

### 1.1 Filtrage automatique des aides par reunion (Critique)
**Probleme** : La selection d'une reunion ne filtre pas les aides associees.

- Ajouter un filtre "Reunion" dans `AidesAdmin.tsx` avec un Select des reunions
- Filtrer automatiquement par `reunion_id` quand une reunion est selectionnee
- Rafraichissement instantane du tableau sans rechargement

### 1.2 Liaison obligatoire Reunion / Exercice (Critique)
**Probleme** : Aides creees sans rattachement strict a une reunion ou exercice.

- Ajouter une colonne `exercice_id` (UUID, NOT NULL) a la table `aides` via migration SQL
- Modifier le schema Zod dans `AideForm.tsx` : rendre `reunion_id` et `exercice_id` obligatoires quand contexte = "reunion"
- Ajouter un Select "Exercice" dans le formulaire avec auto-selection de l'exercice actif
- Validation backend via contraintes DB (cle etrangere)

### 1.3 Enregistrement detaille d'une aide (Haute)
**Probleme** : Informations financieres parfois incompletes.

- Verifier que tous les champs obligatoires sont bien valides (membre, motif, montant, type, date, statut, reunion, exercice)
- Ajouter un champ "motif" dans le formulaire et la table si absent
- Enrichir l'affichage du tableau avec colonnes exercice et motif

### 1.4 Impact automatique sur la Caisse (Critique)
**Probleme** : Les aides validees ne generent pas automatiquement une sortie de caisse.

- Creer un trigger SQL sur la table `aides` :
  - INSERT avec statut='alloue' → creer une sortie dans `fond_caisse_operations`
  - UPDATE statut vers 'alloue' → creer la sortie
  - UPDATE statut depuis 'alloue' vers autre → supprimer la sortie
- Utiliser `source_table='aides'` et `source_id=aide.id` pour la tracabilite
- Categorie : 'aide'

### 1.5 Export PDF/Excel des aides (Moyenne)
**Probleme** : Pas d'export global.

- Ajouter un bouton "Export PDF" et "Export Excel" dans `AidesAdmin.tsx`
- Generer un tableau avec colonnes (Date, Beneficiaire, Type, Montant, Reunion, Exercice, Statut)
- Inclure les totaux par statut et par type
- Logo E2D en en-tete du PDF

### 1.6 Permissions strictes (Critique)
**Probleme** : Tous les roles peuvent creer/modifier des aides.

- Verifier les RLS policies existantes (deja en place avec `has_permission`)
- S'assurer que seuls Admin/Tresorier/Commissaire ont les permissions `aides.create` et `aides.update` dans `role_permissions`
- Masquer les boutons UI selon `hasPermission` (deja fait partiellement)
- Verifier dans la matrice des permissions que les roles sont correctement configures

---

## Phase 2 : Module Fonds de Caisse (10 corrections)

### 2.1 Coherence synthese vs details (Critique)
**Probleme** : Ecarts entre la synthese et les transactions detaillees.

- Refactoriser `useCaisseSynthese.ts` pour que tous les totaux soient calcules directement depuis `fond_caisse_operations` via `SUM()` SQL
- Supprimer tout calcul base sur des valeurs stockees/cachees
- Source unique de verite = table `fond_caisse_operations`

### 2.2 Journal comptable centralise (Critique)
**Probleme** : Pas de registre unique retracant tous les mouvements.

- La table `fond_caisse_operations` sert deja de ledger avec `source_table` et `source_id`
- Ajouter une vue "Journal comptable" dans un nouvel onglet de `CaisseAdmin.tsx`
- Afficher : date, type, module source, montant, sens (entree/sortie), reference, operateur
- Filtres par periode, module source, categorie

### 2.3 Entrees automatiques completes (Critique)
**Probleme** : Certains paiements ne creditent pas la caisse.

- Verifier et creer les triggers SQL manquants :
  - `cotisations` (statut='paye') → entree caisse ✓ (fonction existe mais trigger absent)
  - `prets_paiements` (INSERT) → entree caisse ✓ (fonction existe mais trigger absent)
  - `reunions_sanctions` (statut='paye') → entree caisse ✓ (fonction existe mais trigger absent)
  - `epargnes` (INSERT) → entree caisse ✓ (fonction existe mais trigger absent)
- **Probleme identifie** : Les fonctions DB existent (`create_caisse_operation_from_source`) mais **aucun trigger n'est actif** dans la base. Il faut creer les triggers.

### 2.4 Sorties automatiques completes (Critique)
**Probleme** : Certaines depenses ne debitent pas la caisse.

- Creer les triggers manquants :
  - `prets` (INSERT) → sortie caisse (decaissement)
  - `aides` (statut='alloue') → sortie caisse (cf. 1.4)
- Trigger de suppression pour nettoyer les operations auto

### 2.5 Solde disponible pour prets (Critique)
**Probleme** : Pas de visibilite claire du montant pretable.

- Deja present dans `CaisseSidePanel.tsx` (widget "Solde Empruntable")
- Verifier le calcul : Fond total * pourcentage - prets en cours
- Ajouter une regle metier configurable dans `caisse_config`

### 2.6 Restriction visibilite caisse (Critique)
**Probleme** : Tous les membres voient les donnees de caisse.

- Modifier la RLS policy `fond_caisse_operations` :
  - Remplacer `USING (true)` par `USING (has_permission('caisse', 'read'))`
  - Seuls Admin/Tresorier/Secretaire General voient les operations
- Proteger la route `/admin/caisse` via `PermissionRoute`

### 2.7 Detail par rubrique (Haute)
**Probleme** : Pas de separation claire par categorie.

- Enrichir l'onglet "Ventilation" existant dans `CaisseAdmin.tsx`
- Ajouter des sous-totaux par categorie avec barres de progression
- Filtres rapides par categorie

### 2.8 Historique et tracabilite (Haute)
**Probleme** : Pas de piste d'audit complete.

- Ajouter `created_by` (UUID) et `updated_by` (UUID) a la table `fond_caisse_operations`
- Creer un trigger `updated_at` (existe deja dans la table)
- Afficher l'operateur et la date de creation dans le tableau

### 2.9 Export financier global (Moyenne)
**Probleme** : Aucun export comptable global.

- L'export PDF existe deja dans `CaisseAdmin.tsx` (`handleExportPDF`)
- Ajouter un export Excel avec totaux par categorie et par periode
- Inclure la synthese en page 1 du PDF

---

## Section technique - Migrations SQL requises

### Migration 1 : Colonne exercice_id sur aides + triggers caisse

```sql
-- Ajouter exercice_id a la table aides
ALTER TABLE aides ADD COLUMN IF NOT EXISTS exercice_id UUID REFERENCES exercices(id);

-- Trigger pour aides -> caisse
CREATE OR REPLACE FUNCTION sync_aide_to_caisse()
RETURNS trigger AS $$
BEGIN
  IF NEW.statut = 'alloue' AND (OLD IS NULL OR OLD.statut != 'alloue') THEN
    INSERT INTO fond_caisse_operations (...)
    VALUES ('sortie', NEW.montant, ..., 'aide', 'aides', NEW.id);
  END IF;
  IF OLD.statut = 'alloue' AND NEW.statut != 'alloue' THEN
    DELETE FROM fond_caisse_operations WHERE source_table='aides' AND source_id=NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_aide_to_caisse
AFTER INSERT OR UPDATE ON aides
FOR EACH ROW EXECUTE FUNCTION sync_aide_to_caisse();
```

### Migration 2 : Activer les triggers caisse manquants

```sql
-- Triggers pour cotisations, epargnes, prets, prets_paiements, sanctions
CREATE TRIGGER trigger_caisse_cotisations
AFTER INSERT OR UPDATE ON cotisations
FOR EACH ROW EXECUTE FUNCTION create_caisse_operation_from_source();

CREATE TRIGGER trigger_caisse_epargnes
AFTER INSERT ON epargnes
FOR EACH ROW EXECUTE FUNCTION create_caisse_operation_from_source();

-- (idem pour prets, prets_paiements, reunions_sanctions)
```

### Migration 3 : Securiser la RLS caisse

```sql
DROP POLICY "Tous peuvent voir operations fond de caisse" ON fond_caisse_operations;
CREATE POLICY "Caisse visible par roles autorises"
ON fond_caisse_operations FOR SELECT
USING (has_permission('caisse', 'read'));
```

### Migration 4 : Audit trail

```sql
ALTER TABLE fond_caisse_operations 
ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id) DEFAULT auth.uid(),
ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES auth.users(id);
```

---

## Fichiers a modifier

| Fichier | Modifications |
|---------|--------------|
| `src/pages/admin/AidesAdmin.tsx` | Filtre reunion, filtre exercice, boutons export PDF/Excel |
| `src/components/forms/AideForm.tsx` | Champ exercice_id obligatoire, validation renforcee |
| `src/hooks/useAides.ts` | Inclure exercice dans la requete select |
| `src/hooks/useCaisseSynthese.ts` | Recalcul depuis fond_caisse_operations uniquement |
| `src/pages/admin/CaisseAdmin.tsx` | Onglet journal comptable, export Excel |
| `src/hooks/useCaisse.ts` | Ajout champs audit (created_by) |
| Migration SQL | 4 migrations (exercice_id, triggers, RLS, audit) |

---

## Ordre d'implementation

1. **Migrations SQL** (triggers caisse + exercice_id + RLS + audit)
2. **Formulaire Aides** (exercice_id obligatoire, validation)
3. **AidesAdmin** (filtres reunion/exercice, export)
4. **CaisseAdmin** (journal comptable, coherence synthese)
5. **Permissions** (verification matrice + RLS caisse)
6. **Tests** de bout en bout

