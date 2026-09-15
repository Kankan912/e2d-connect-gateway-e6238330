# Comptes rendus de séance : envoi à tous les membres

## Objectif

Le compte rendu d'une séance doit toujours partir à l'ensemble des membres actifs de l'association disposant d'une adresse e-mail, jamais seulement aux personnes présentes.

## Ce qui change

1. **Fenêtre « Notifier la réunion »** : le choix « Présents » / « Absents » disparaît. Un simple libellé indique que le compte rendu part à tous les membres actifs, avec le nombre de destinataires.
2. **Envoi à la clôture** : inchangé côté destinataires (déjà tout le monde), mais on force explicitement l'envoi à tous.
3. **Service d'envoi** : le paramètre de restriction n'est plus accepté ; la liste est toujours calculée côté serveur à partir des membres actifs de l'association de la réunion.

Périmètre confirmé : membres actifs uniquement (les comptes d'accès sans fiche membre ne sont pas ajoutés).

## Détails techniques

- `src/components/NotifierReunionModal.tsx` : supprimer `RecipientType`, l'état `recipientType`, le `RadioGroup` de sélection et les branches `presents` / `absents` du calcul `destinataires` ; ne plus envoyer `cible` dans l'appel. La liste affichée reste celle des membres actifs avec e-mail (indicative).
- `supabase/functions/send-reunion-cr/index.ts` : retirer le champ `cible` de l'interface et le bloc de filtrage par présences ; les destinataires sont toujours les membres actifs de `reunion.association_id` ayant un e-mail.
- `src/components/reunions/cloture/useClotureReunion.ts` : aucun changement de destinataires nécessaire (aucune `cible` envoyée) ; vérifier seulement qu'aucun filtrage résiduel ne subsiste.
- Vérification : `deno check` sur la fonction modifiée et contrôle TypeScript du front.
