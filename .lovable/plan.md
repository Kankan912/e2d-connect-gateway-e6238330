# Lot 1.5 — Choix SMTP / Resend + config domaine pro (report) ✅ LIVRÉ

Statut : livré. CHANGELOG + Guide utilisateur mis à jour ; état runtime vérifié
(`email_service=smtp`, `smtp_config` actif sur Gmail). Aucune modif code/schéma.

---


## Constat après audit

L'infrastructure multi-provider existe déjà et couvre 100 % du besoin exprimé :

| Élément | État |
|---|---|
| Toggle `email_service` (`resend` \| `smtp`) | ✅ Table `configurations` + UI radio dans `EmailConfigManager.tsx` |
| Envoi SMTP Gmail | ✅ `sendViaSMTP` + table `smtp_config` (34/34 OK en prod) |
| Envoi Resend | ✅ `sendViaResend` — clé lue via `configurations.resend_api_key` puis fallback env `RESEND_API_KEY` |
| Fallback automatique | ✅ `sendEmail()` bascule sur l'autre provider si le principal échoue |
| Test admin | ✅ `test-email-configuration` avec 3 modes (`auto` / `resend` / `smtp`) et `enableFallback` |
| Domaine expéditeur configurable | ✅ Champs `email_expediteur` / `email_expediteur_nom` dans l'UI |
| App URL configurable | ✅ Champ `app_url` idem |

Ce projet est branché sur un Supabase externe : les emails managés Lovable ne sont pas disponibles ici (voir garde-fou `email-managed-cloud-required`). La voie "domaine pro" reste donc Resend + domaine vérifié dans Resend, activable plus tard par simple mise à jour de `email_expediteur` + clé Resend valide — sans code additionnel.

## Périmètre du Lot 1.5

Aucune modification de code ni de schéma requise. Le Lot 1.5 devient un **lot documentaire + validation** :

1. **`docs/CHANGELOG.md`** : entrée "Lot 1.5 — Multi-provider email (SMTP/Resend) — validation & documentation" listant :
   - Provider actif (SMTP Gmail), toggle disponible, fallback en place
   - Clé Resend conservée en l'état (décision utilisateur) — non testée
   - Chemin de bascule "domaine pro" documenté pour plus tard

2. **`docs/GUIDE_UTILISATEUR.md`** (ou section existante) : ajout d'un court paragraphe "Configuration email" expliquant à l'admin :
   - Où changer de provider (`Admin → Configuration → Emails`)
   - Comment tester chaque provider avec les boutons "Tester SMTP" / "Tester Resend" / "Tester auto+fallback"
   - Procédure future pour passer à un domaine pro (créer le domaine dans Resend, coller la nouvelle clé, mettre à jour `email_expediteur`, tester Resend)

3. **Vérification runtime** (lecture seule, aucun envoi) :
   - Confirmer que `email_service` est bien positionné à `smtp` en base
   - Confirmer que `smtp_config` contient les identifiants Gmail actifs
   - Signaler à l'utilisateur si un des deux est incohérent

## Hors périmètre (explicitement)

- Aucune modification de la clé `RESEND_API_KEY` (décision utilisateur).
- Aucun test d'envoi Resend automatisé (nécessiterait une clé valide).
- Pas de connecteur Lovable Resend activé ici — le code utilise déjà la clé stockée en base, changer cela casserait l'existant.
- Pas de scaffold `auth-email-hook` (indisponible sur Supabase externe).

## Vérification

- CHANGELOG mis à jour, guide utilisateur enrichi.
- Requête SQL retournant `email_service = 'smtp'` et un `smtp_config` actif.
- Aucun changement fonctionnel visible côté app (envois continuent via SMTP Gmail).

## Fichiers touchés

| Fichier | Action |
|---|---|
| `docs/CHANGELOG.md` | ajout entrée Lot 1.5 |
| `docs/GUIDE_UTILISATEUR.md` | ajout section "Configuration email" |

## Après Lot 1.5

Phase 1 est complètement livrée. Le passage à un domaine pro pourra être fait à tout moment sans code : nouvelle clé Resend + `email_expediteur=noreply@ton-domaine.tld` + toggle `Resend` dans l'UI.
