
# Plan d'Action Correctif E2D - Exécution Phase par Phase

## PHASE 1 - Corrections Critiques Bloquantes (Priorité Immédiate)

### 1.1 Exercice Actif - Erreur "Aucun exercice actif"
**Problème** : La requête `.single()` échoue car il y a 2 exercices marqués 'actif' en base de données.

**Fichier** : `src/components/CotisationsCumulAnnuel.tsx` (lignes 27-34)

**Corrections** :
```text
1. Modifier la requête pour gérer les cas multiples:
   - Remplacer .single() par .limit(1)
   - Ou trier par date_debut DESC pour prendre le plus récent
   
2. Corriger la base de données:
   - Un seul exercice doit être "actif" à la fois
```

**SQL préalable** :
```sql
UPDATE exercices SET statut = 'cloture' 
WHERE id = '9f764af9-3239-4838-9017-86f2ad8a9ad0'; 
-- Garder uniquement "Exercice 2026 - 2027" comme actif
```

---

### 1.2 Réouverture Réunion - Déverrouillage Incomplet
**Problème** : Les cotisations et opérations caisse restent verrouillées après réouverture.

**Fichier** : `src/components/ReouvrirReunionModal.tsx`

**Ajouts après ligne 45** :
```typescript
// Déverrouiller les cotisations liées
const { error: cotisError } = await supabase
  .from("cotisations")
  .update({ verrouille: false })
  .eq("reunion_id", reunionId);

// Déverrouiller les opérations caisse
const { error: caisseError } = await supabase
  .from("fond_caisse_operations")
  .update({ verrouille: false })
  .eq("reunion_id", reunionId);
```

---

### 1.3 Navigation Réunions - Liens Nouvel Onglet
**Problème** : Certains liens ouvrent un nouvel onglet au lieu de naviguer dans l'application.

**Fichier** : `src/pages/Reunions.tsx`

**Action** : Rechercher et supprimer tous les `target="_blank"` sur les liens internes.

---

## PHASE 2 - Emails et Notifications (1-2 heures)

### 2.1 Debug Edge Function send-campaign-emails
**Problème** : "0 email(s) envoyé(s)" malgré des destinataires valides.

**Fichiers** :
- `supabase/functions/send-campaign-emails/index.ts`
- `supabase/functions/_shared/email-utils.ts`

**Actions** :
1. Ajouter des logs détaillés pour identifier où échoue l'envoi
2. Vérifier que `getFullEmailConfig()` retourne bien la clé Resend
3. Vérifier que la table `configurations` contient `resend_api_key`

**Diagnostic SQL** :
```sql
SELECT * FROM configurations WHERE cle = 'resend_api_key';
SELECT * FROM configurations WHERE cle = 'email_service';
```

---

### 2.2 Notifications Calendrier Bénéficiaires
**Fichier** : `supabase/functions/send-calendrier-beneficiaires/index.ts`

**Action** : Appliquer les mêmes corrections que 2.1 (même dépendance email-utils).

---

## PHASE 3 - Améliorations UX (2-3 heures)

### 3.1 Mois Éditable pour Bénéficiaires
**Problème** : Le mois est affiché en Badge fixe, non modifiable.

**Fichier** : `src/components/config/CalendrierBeneficiairesManager.tsx`

**Modification lignes 69-81** :
```text
Remplacer le Badge statique par un composant Select
- Permettre la modification si !isLocked && isAdmin
- Appeler updateBeneficiaire.mutate avec le nouveau mois
```

---

### 3.2 Devise FCFA Cohérente
**Problème** : Certains écrans affichent "€" au lieu de "FCFA".

**Actions** :
1. Auditer tous les fichiers avec: `grep -r "€\|EUR\|toLocaleString.*currency" src/`
2. Remplacer par `formatFCFA()` de `@/lib/utils`

**Fichiers probables** :
- `src/components/CotisationsCumulAnnuel.tsx` (utilise `.toLocaleString()` + " FCFA" correctement)
- Autres composants cotisations/prêts à vérifier

---

### 3.3 Prêts - Paiement Partiel
**Problème** : L'intérêt est recalculé à tort lors d'un paiement partiel.

**Règle métier correcte** :
- Intérêt fixé à la création du prêt, jamais recalculé
- Paiement partiel: d'abord sur l'intérêt, puis sur le capital

**Fichiers à auditer** :
- `src/hooks/useEpargnes.ts`
- `src/pages/Epargnes.tsx`
- `src/components/PretsPaiementsManager.tsx`

---

## PHASE 4 - Utilisateurs et Membres (1 heure)

### 4.1 Centralisation Gestion Utilisateurs
**Problème** : Confusion entre comptes utilisateurs (auth) et membres (association).

**Clarification architecture** :
- `profiles` = Utilisateurs Supabase Auth (email/mot de passe)
- `membres` = Membres de l'association E2D
- Lien via `membres.user_id -> profiles.id`

**Fichier** : `src/pages/admin/UtilisateursAdmin.tsx`

**Vérifications** :
1. Affiche-t-il uniquement les `profiles` ou mélange-t-il avec `membres`?
2. Le menu Config → Utilisateurs est-il accessible?

---

## PHASE 5 - Audit Calculs Caisse (30 min)

### 5.1 Totaux Caisse Incohérents
**Fichier** : `src/hooks/useCaisseSynthese.ts`

**Actions** :
1. Vérifier les filtres par catégorie (epargne, cotisation, etc.)
2. Comparer les calculs frontend avec les données brutes en base
3. Ajouter des logs temporaires pour debug

---

## Ordre d'Exécution Recommandé

| Phase | Tâche | Durée | Bloquant |
|-------|-------|-------|----------|
| 1.1 | Fix exercice actif | 15 min | OUI |
| 1.2 | Déverrouillage réouverture | 20 min | OUI |
| 1.3 | Navigation SPA | 15 min | Non |
| 2.1 | Debug emails campagne | 45 min | OUI |
| 2.2 | Emails calendrier | 15 min | Non |
| 3.1 | Mois éditable | 30 min | Non |
| 3.2 | Audit devise FCFA | 30 min | Non |
| 3.3 | Paiement partiel prêts | 45 min | Non |
| 4.1 | Utilisateurs/Membres | 30 min | Non |
| 5.1 | Audit caisse | 30 min | Non |

**Durée totale estimée : 4-5 heures**

---

## Points Déjà Fonctionnels (FAIT)

| # | Fonctionnalité | État |
|---|----------------|------|
| 1 | Email unique membre | Message convivial implémenté |
| 3 | Montants individuels cotisations | Table dédiée utilisée |
| 8 | Multi-bénéficiaires par mois | Supporté dans le code |
| 9 | Drag & drop ordre bénéficiaires | DnD Kit intégré |

---

## Tests de Validation par Phase

**Phase 1** :
- Vérifier que "Suivi Cumulatif Annuel" affiche les données
- Clôturer puis rouvrir une réunion, vérifier l'édition des cotisations

**Phase 2** :
- Créer une campagne test avec 1-2 destinataires
- Vérifier les logs edge function dans Supabase Dashboard
- Confirmer réception email

**Phase 3** :
- Modifier le mois d'un bénéficiaire
- Vérifier l'affichage FCFA partout (pas de €)

**Phase 4** :
- Naviguer dans Config → Utilisateurs
- Vérifier la distinction membres/utilisateurs
