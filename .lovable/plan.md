
# Plan d'implémentation - Phase 3 : Priorité Moyenne (~2h30)

## Résumé de l'Analyse

### Ce qui est déjà bien implémenté :
1. **Templates notifications** : 7 templates existent déjà dans la base de données (rappel_cotisation, reunion_convocation, pret_echeance, sanction_notification, epargne_rappel, creation_compte, reunion_cr)
2. **Navigation événements cliquable** : Les cartes d'événements sont déjà des `<Link>` vers `/evenements/:id` (ligne 66)
3. **Page EventDetail** : Route et composant `/evenements/:id` déjà fonctionnels

### Ce qui nécessite des corrections :

| Point | État Actuel | Correction Requise |
|-------|-------------|----------------------|
| Sélection destinataires | Seulement les "présents" sont notifiés | Ajouter RadioGroup (Tous/Présents/Absents/Sélection manuelle) |
| Limite événements | `events.slice(0, 4)` = limite statique de 4 | Augmenter ou supprimer la limite, ajouter bouton "Voir plus" |
| Formatage devise FCFA | ~15 fichiers utilisent `toLocaleString()` manuellement | Remplacer par `formatFCFA()` de `src/lib/utils.ts` |

---

## Correction 3.1 : Sélection des destinataires dans NotifierReunionModal

**Fichier** : `src/components/NotifierReunionModal.tsx`

**Modifications** :

1. **Ajouter état pour le type de destinataire** :
```typescript
const [recipientType, setRecipientType] = useState<"tous" | "presents" | "absents" | "manuel">("presents");
const [selectedMembers, setSelectedMembers] = useState<Set<string>>(new Set());
```

2. **Ajouter RadioGroup pour sélection** (après la Card des infos réunion) :
```typescript
<div className="space-y-2">
  <Label className="text-sm font-medium">Destinataires</Label>
  <RadioGroup value={recipientType} onValueChange={(v) => setRecipientType(v as any)}>
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="tous" id="tous" />
      <Label htmlFor="tous" className="font-normal">Tous les membres avec email</Label>
    </div>
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="presents" id="presents" />
      <Label htmlFor="presents" className="font-normal">Présents uniquement</Label>
    </div>
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="absents" id="absents" />
      <Label htmlFor="absents" className="font-normal">Absents/Excusés uniquement</Label>
    </div>
    <div className="flex items-center space-x-2">
      <RadioGroupItem value="manuel" id="manuel" />
      <Label htmlFor="manuel" className="font-normal">Sélection manuelle</Label>
    </div>
  </RadioGroup>
</div>
```

3. **Modifier le calcul des destinataires selon le type** :
```typescript
const destinataires = useMemo(() => {
  if (!presences) return [];
  
  let filtered = presences;
  
  if (recipientType === "presents") {
    filtered = presences.filter(p => p.statut_presence === "present");
  } else if (recipientType === "absents") {
    filtered = presences.filter(p => 
      p.statut_presence === "absent_non_excuse" || p.statut_presence === "excuse"
    );
  } else if (recipientType === "manuel") {
    filtered = presences.filter(p => selectedMembers.has(p.membre?.id || ""));
  }
  // "tous" = pas de filtre
  
  return filtered
    .filter(p => p.membre?.email)
    .map(p => ({
      email: p.membre!.email!,
      nom: p.membre!.nom,
      prenom: p.membre!.prenom,
    }));
}, [presences, recipientType, selectedMembers]);
```

4. **Ajouter interface de sélection manuelle** (si recipientType === "manuel") :
```typescript
{recipientType === "manuel" && (
  <div className="max-h-40 overflow-y-auto border rounded-lg p-2 space-y-1">
    {presences?.filter(p => p.membre?.email).map((p) => (
      <div key={p.id} className="flex items-center space-x-2">
        <Checkbox 
          id={p.id}
          checked={selectedMembers.has(p.membre?.id || "")}
          onCheckedChange={(checked) => {
            const newSet = new Set(selectedMembers);
            if (checked) {
              newSet.add(p.membre?.id || "");
            } else {
              newSet.delete(p.membre?.id || "");
            }
            setSelectedMembers(newSet);
          }}
        />
        <Label htmlFor={p.id} className="font-normal text-sm">
          {p.membre?.prenom} {p.membre?.nom}
        </Label>
      </div>
    ))}
  </div>
)}
```

5. **Imports à ajouter** :
```typescript
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useMemo } from "react";
```

---

## Correction 3.2 : Augmenter limite événements et ajouter pagination

**Fichier** : `src/components/Events.tsx`

**Modifications** :

1. **Ajouter état pour le nombre d'événements affichés** :
```typescript
const [displayCount, setDisplayCount] = useState(4);
```

2. **Remplacer slice(0, 4) par slice dynamique** (ligne 65) :
```typescript
events.slice(0, displayCount).map((event: any) => (
```

3. **Ajouter bouton "Voir plus"** après la liste d'événements :
```typescript
{events && events.length > displayCount && (
  <Button 
    variant="outline" 
    onClick={() => setDisplayCount(prev => prev + 4)}
    className="w-full mt-4"
  >
    Voir plus d'événements ({events.length - displayCount} restants)
  </Button>
)}
```

4. **Imports à ajouter** :
```typescript
import { useState } from "react";
import { Button } from "@/components/ui/button";
```

---

## Correction 3.3 : Standardiser formatage FCFA

**Fichiers à modifier** (portail interne uniquement) :

| Fichier | Lignes | Remplacement |
|---------|--------|--------------|
| `src/components/MemberDetailSheet.tsx` | 67-69 | Supprimer `formatCurrency` local, importer `formatFCFA` |
| `src/pages/dashboard/DashboardHome.tsx` | 50 | `{formatFCFA(summary.totalEpargnes)}` |
| `src/pages/dashboard/MyCotisations.tsx` | 90 | `{formatFCFA(cotisation.montant)}` |
| `src/pages/dashboard/MyEpargnes.tsx` | 118 | `{formatFCFA(epargne.montant)}` |
| `src/pages/dashboard/MyAides.tsx` | 145 | `{formatFCFA(aide.montant || 0)}` |
| `src/components/PhoenixCotisationsAnnuelles.tsx` | 105 | `{formatFCFA(cotisation.montant || 0)}` |
| `src/components/config/ExercicesManager.tsx` | 351-352 | `{formatFCFA(exercice.croissance_fond_caisse || 0)}` |
| `src/components/notifications/NotificationToaster.tsx` | 54 | `formatFCFA(Number(sanction.montant))` |
| `src/hooks/useCaisse.ts` | 155-162 | Utiliser `formatFCFA()` pour les alertes |
| `supabase/functions/send-sanction-notification/index.ts` | 156 | Formater manuellement (pas de module disponible en edge) |

**Pattern de remplacement** :
```typescript
// AVANT
{montant.toLocaleString('fr-FR')} FCFA

// APRÈS
import { formatFCFA } from "@/lib/utils";
// ...
{formatFCFA(montant)}
```

**Note** : Les fichiers de dons publics (`Adhesion.tsx`, `DonationsTable.tsx`, `payment-utils.ts`) conservent le multi-devises (EUR/USD).

---

## Correction 3.4 : Templates notifications (DÉJÀ FAIT)

Les templates par défaut existent déjà en base de données :
- `rappel_cotisation`
- `reunion_convocation`
- `pret_echeance`
- `sanction_notification`
- `epargne_rappel`
- `creation_compte`
- `reunion_cr`

Pas de migration SQL nécessaire pour ce point.

---

## Fichiers à Modifier

| Fichier | Modifications |
|---------|---------------|
| `src/components/NotifierReunionModal.tsx` | RadioGroup sélection destinataires, Checkboxes manuelles |
| `src/components/Events.tsx` | Pagination dynamique, bouton "Voir plus" |
| `src/components/MemberDetailSheet.tsx` | Import formatFCFA, supprimer local formatCurrency |
| `src/pages/dashboard/DashboardHome.tsx` | Utiliser formatFCFA |
| `src/pages/dashboard/MyCotisations.tsx` | Utiliser formatFCFA |
| `src/pages/dashboard/MyEpargnes.tsx` | Utiliser formatFCFA |
| `src/pages/dashboard/MyAides.tsx` | Utiliser formatFCFA |
| `src/components/PhoenixCotisationsAnnuelles.tsx` | Utiliser formatFCFA |
| `src/components/config/ExercicesManager.tsx` | Utiliser formatFCFA |
| `src/components/notifications/NotificationToaster.tsx` | Utiliser formatFCFA |
| `src/hooks/useCaisse.ts` | Utiliser formatFCFA |

---

## Estimation

| Tâche | Temps |
|-------|-------|
| NotifierReunionModal (sélection destinataires) | 45 min |
| Events.tsx (pagination) | 15 min |
| Standardisation formatFCFA (11 fichiers) | 45 min |
| Tests et vérifications | 30 min |
| **Total Phase 3** | **~2h15** |

---

## Tests de Validation

1. **Sélection destinataires** :
   - Ouvrir NotifierReunionModal → Vérifier les 4 options RadioGroup
   - Choisir "Tous" → Compteur affiche tous les membres avec email
   - Choisir "Absents" → Compteur affiche excusés + absents non excusés
   - Choisir "Sélection manuelle" → Cocher quelques membres → Vérifier compteur

2. **Pagination événements** :
   - Page d'accueil → Section événements → 4 premiers affichés
   - Cliquer "Voir plus" → 4 suivants chargés
   - Répéter jusqu'à épuisement → Bouton disparaît

3. **Formatage FCFA** :
   - Dashboard membre → Vérifier format "XX XXX FCFA" sans "€"
   - MemberDetailSheet → Vérifier épargnes, prêts, cotisations
   - Notifications toast → Vérifier montant formaté

4. **Non-régression dons publics** :
   - Page /adhesion → Montants toujours en "€"
   - Admin dons → Montants affichent la devise (EUR/USD/FCFA)
