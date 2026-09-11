# Test d'envoi des notifications de réunion

Objectif : vérifier, sur de vrais emails reçus à `alexr.fotso@gmail.com`, que la date, l'heure, le lieu et l'ordre du jour s'affichent réellement (et non sous forme de `{date_reunion}`, `{lieu}`, etc.).

## Déroulé du test

### 1. Réunion de test
Créer une réunion fictive avec des valeurs reconnaissables :
- Date et heure : une date future précise (ex. jeudi 24 septembre 2026, 18:30)
- Lieu : « Salle de test — Douala »
- Ordre du jour : trois points identifiables
- Sujet : « Réunion de test notifications »

### 2. Test 1 — Invitation / campagne
- Créer une campagne rattachée à cette réunion, avec un message contenant les variables `{date_reunion}`, `{heure_reunion}`, `{lieu}`, `{ordre_du_jour}`, `{sujet_reunion}`, `{prenom}`.
- L'envoyer uniquement à `alexr.fotso@gmail.com`.
- Vérifier dans l'email reçu que chaque variable est remplacée par la vraie valeur.

### 3. Test 2 — Compte-rendu de réunion
- Déclencher l'envoi d'un compte-rendu pour cette même réunion vers `alexr.fotso@gmail.com`.
- Vérifier l'encart d'informations : date, heure, lieu, ordre du jour, plus le corps du compte-rendu.
- Vérifier aussi que la liste des destinataires proposée couvre bien tous les membres actifs, pas seulement les présents.

### 4. Contrôle et nettoyage
- Consulter les journaux d'envoi pour confirmer l'absence d'erreur.
- Si une variable reste non remplacée, corriger la fonction d'envoi concernée et refaire l'envoi jusqu'à un résultat correct.
- Supprimer la réunion de test et la campagne de test une fois la vérification terminée.

## Résultat attendu
Deux emails reçus à `alexr.fotso@gmail.com` affichant date, heure, lieu et ordre du jour lisibles, et un compte rendu de ce qui a été observé (avec correction éventuelle si un champ manque).

## Détails techniques
- Réunion de test insérée dans `reunions` (association E2D), campagne dans `notifications_campagnes` avec `reunion_id` renseigné.
- Envois via les fonctions `send-campaign-emails` et `send-reunion-cr`, destinataire unique forcé.
- Vérification des logs des deux fonctions ; repli « à préciser » / « non précisé » contrôlé en laissant volontairement un champ vide lors d'un second envoi de contrôle.
- Suppression finale des lignes de test (réunion, campagne, envois associés).
