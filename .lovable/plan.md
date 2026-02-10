
# Code Review - Manquements restants

## Corrections EFFECTIVES (OK)

| # | Correction | Statut |
|---|-----------|--------|
| 1.1 | Filtrage aides par reunion | OK - Select filtre reunion dans AidesAdmin.tsx |
| 1.2 | Exercice obligatoire sur aides | OK - colonne `exercice_id` ajoutee, formulaire avec validation Zod |
| 1.3 | Enregistrement detaille | OK - colonnes exercice et contexte affichees dans le tableau |
| 1.5 | Export PDF/Excel aides | OK - les 2 boutons fonctionnent avec totaux |
| 1.6 | Permissions strictes aides | OK - `hasPermission` sur boutons create/update/delete, route protegee |
| 2.1 | Coherence synthese vs details | OK - `useCaisseSynthese.ts` calcule tout depuis `fond_caisse_operations` |
| 2.2 | Journal comptable | OK - onglet Journal avec solde cumule, debit/credit, operateur |
| 2.3 | Entrees auto (cotisations, epargnes, prets_paiements) | OK - triggers actifs en DB |
| 2.5 | Solde empruntable | OK - calcul dans `useCaisseSynthese.ts` |
| 2.6 | RLS caisse | OK - policy `has_permission('caisse', 'read') OR is_admin()` |
| 2.7 | Ventilation par categorie | OK - composant `VentilationTable` avec pourcentages |
| 2.8 | Audit trail (created_by, updated_by) | OK - colonnes ajoutees + trigger |
| 2.9 | Export financier global | OK - Export PDF et Excel dans CaisseAdmin |

## Corrections MANQUANTES (a corriger)

### Probleme 1 : Trigger UPDATE manquant sur `aides` (Critique - point 1.4)
La table `aides` a des triggers INSERT et DELETE mais **pas de trigger UPDATE**. Quand on change le statut d'une aide de "demandee" vers "alloue" (ou inversement), **aucune operation de caisse n'est creee/supprimee**.

**Correction** : Creer un trigger `trigger_caisse_aides_update` sur UPDATE de la colonne `statut`.

### Probleme 2 : Trigger manquant sur `reunions_sanctions` (Critique - point 2.3)
**Aucun trigger caisse n'existe** pour la table `reunions_sanctions`. Quand une sanction est payee (statut='paye'), aucune entree n'est generee en caisse.

**Correction** : Creer les triggers INSERT/UPDATE/DELETE pour `reunions_sanctions` vers `create_caisse_operation_from_source()`.

### Probleme 3 : Trigger manquant pour prets DELETE (Haute - point 2.4)
Si un pret est supprime, l'operation de sortie de caisse n'est pas nettoyee (pas de trigger DELETE sur `prets`).

**Correction** : Ajouter `trigger_caisse_prets_delete` sur la table `prets`.

## Section technique

### Migration SQL a creer

```sql
-- 1. Trigger UPDATE sur aides (impact caisse quand statut change)
DROP TRIGGER IF EXISTS trigger_caisse_aides_update ON aides;
CREATE TRIGGER trigger_caisse_aides_update
  AFTER UPDATE OF statut ON aides
  FOR EACH ROW
  EXECUTE FUNCTION create_caisse_operation_from_source();

-- 2. Triggers sur reunions_sanctions (sanctions payees -> entree caisse)
DROP TRIGGER IF EXISTS trigger_caisse_sanctions_insert ON reunions_sanctions;
CREATE TRIGGER trigger_caisse_sanctions_insert
  AFTER INSERT ON reunions_sanctions
  FOR EACH ROW
  EXECUTE FUNCTION create_caisse_operation_from_source();

DROP TRIGGER IF EXISTS trigger_caisse_sanctions_update ON reunions_sanctions;
CREATE TRIGGER trigger_caisse_sanctions_update
  AFTER UPDATE OF statut ON reunions_sanctions
  FOR EACH ROW
  EXECUTE FUNCTION create_caisse_operation_from_source();

DROP TRIGGER IF EXISTS trigger_caisse_sanctions_delete ON reunions_sanctions;
CREATE TRIGGER trigger_caisse_sanctions_delete
  BEFORE DELETE ON reunions_sanctions
  FOR EACH ROW
  EXECUTE FUNCTION create_caisse_operation_from_source();

-- 3. Trigger DELETE sur prets (nettoyage operation caisse)
DROP TRIGGER IF EXISTS trigger_caisse_prets_delete ON prets;
CREATE TRIGGER trigger_caisse_prets_delete
  BEFORE DELETE ON prets
  FOR EACH ROW
  EXECUTE FUNCTION create_caisse_operation_from_source();
```

### Verification de la fonction `create_caisse_operation_from_source`

Il faut s'assurer que la fonction gere correctement les tables `reunions_sanctions` (avec champ `montant_amende`) et `aides` (avec champ `statut` pour ne creer l'operation que si statut = 'alloue').

### Fichiers concernes

| Fichier | Action |
|---------|--------|
| Nouvelle migration SQL | Creer les 3 triggers manquants |
| Verification `create_caisse_operation_from_source` | S'assurer que `reunions_sanctions` et `aides` UPDATE sont geres |

### Pas de modification frontend necessaire

Le code frontend (AidesAdmin, CaisseAdmin, useCaisseSynthese, useAides, AideForm, Dashboard routes) est complet et correct. Seuls les triggers DB manquent.
