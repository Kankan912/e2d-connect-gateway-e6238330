# Correction du filtre "Historique des connexions"

## Problème
Le filtre par statut (Succès / Échec / Bloqué) ne fonctionne pas car les valeurs en base ne correspondent pas aux valeurs comparées dans le code.

- **En base actuellement** : `statut = 'reussi'` (12 lignes legacy)
- **Code & nouveau tracker** : utilisent `'succes'`, `'echec'`, `'bloque'`
- **Trigger `update_last_login_on_connexion`** : ne se déclenche que si `statut = 'succes'`, donc `last_login` n'est jamais mis à jour avec les anciennes lignes `'reussi'`.

Conséquence : sélectionner "Succès" filtre sur `'succes'` alors que les lignes existantes valent `'reussi'` → tableau vide.

## Solution

### 1. Migration SQL (normalisation + contrainte)
- Mettre à jour les lignes existantes : `UPDATE historique_connexion SET statut = 'succes' WHERE statut = 'reussi';`
- Ajouter une contrainte CHECK pour garantir des valeurs cohérentes : `statut IN ('succes', 'echec', 'bloque')`.
- Le trigger existant qui met à jour `last_login` continuera de fonctionner correctement.

### 2. Robustesse front
Dans `MonitoringAdmin.tsx` (onglet Connexions) :
- Normaliser à la lecture : traiter `'reussi'` comme alias de `'succes'` (sécurité au cas où d'autres lignes legacy existeraient).
- Le badge affichera "succes" au lieu de "reussi".

### 3. Vérification
Aucun autre code n'écrit `'reussi'`. Tous les writers (`Auth.tsx`, `AuthContext.tsx`, `useConnectionTracker.ts`) utilisent déjà la convention `succes/echec/bloque`.

## Fichiers touchés
- `supabase/migrations/<timestamp>_normalize_historique_connexion_statut.sql` (nouveau)
- `src/pages/admin/MonitoringAdmin.tsx` (mineur — normalisation défensive)

## Résultat attendu
- Le filtre "Succès" affiche les 12 lignes existantes + futures connexions.
- Les filtres "Échec" et "Bloqué" fonctionnent dès qu'il y a des données.
- `last_login` se met à jour automatiquement à chaque login réussi.
