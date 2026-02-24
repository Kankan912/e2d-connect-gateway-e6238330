

# Code Review Phase 2 + Plan Phase 3

## Phase 2 — Verdict : CONFORME

Les 3 points du plan ont ete correctement implementes :

**1. EventDetail — Ordre chronologique** — `EventDetail.tsx` lignes 473-501 : la section "Album Photos" est maintenant rendue **avant** la section "Photos & Videos du match" (lignes 504-548). Les deux sections ont `className="mb-6"` pour un espacement coherent. Conforme.

**2. sync-events.ts — Persistance match_id** — `sync-events.ts` ligne 83 : `match_id: matchId` est explicitement inclus dans `eventData` lors de l'insertion/mise a jour dans `site_events`. Le CR sera donc accessible via `event?.match_id` dans EventDetail. Conforme.

**3. AlbumDetail — Fallback navigation** — `AlbumDetail.tsx` lignes 51-56 : le bouton retour verifie `window.history.length <= 1` et redirige vers `/#galerie` si pas d'historique, sinon `navigate(-1)`. Conforme.

**Aucun bug detecte. Phase 2 validee. Passage a la Phase 3.**

---

## Phase 3 — Beneficiaires Mensuels

### Audit du code existant

| Point du cahier des charges | Statut | Preuve |
|---|---|---|
| Montant = mensuel x 12 | OK | DB: `montant_total NUMERIC GENERATED ALWAYS AS (montant_mensuel * 12) STORED` — calcul automatique cote base |
| Modification du mois | OK | `CalendrierBeneficiairesManager.tsx` ligne 353: `handleMoisChange` met a jour `mois_benefice` via `updateBeneficiaire` |
| Modification du montant | OK | Ligne 348: `handleMontantChange` met a jour `montant_mensuel`, le `montant_total` se recalcule automatiquement (colonne generee) |
| Drag-and-drop reordering | OK | Lignes 359-380: `DndContext` avec `@dnd-kit/sortable`, `reorderBeneficiaires` avec rangs temporaires +1000 pour eviter les conflits de contrainte unique |
| Multi-beneficiaires par mois | OK | Lignes 54-55, 91-95: affichage position X/Y dans le mois, dialog d'ajout montre le nombre existant par mois |
| Initialisation calendrier | OK | Lignes 168-197: `initializeCalendrier` cree les entrees pour tous les membres E2D actifs |
| Export PDF | OK | Lignes 252-307: generation PDF avec logo E2D, tableau et totaux |
| Edge Function notifications | PARTIEL | `send-calendrier-beneficiaires` est complet et bien structure, mais necessite validation en conditions reelles |

### Points restants a corriger (Phase 3)

**1. Edge Function : tester l'envoi effectif**

La fonction `send-calendrier-beneficiaires` est bien codee, mais il faut verifier que :
- La cle Resend est bien configuree dans la table `configurations` (cle `resend_api_key`)
- Le `fromEmail` est un domaine verifie dans Resend (sinon erreur 403)
- La fonction est bien deployee

**Action** : Tester l'edge function via `curl_edge_functions` pour verifier le retour. Verifier les logs en cas d'erreur. Si la cle Resend n'est pas configuree, s'assurer que le fallback `onboarding@resend.dev` est bien utilise (seul domaine qui fonctionne sans verification).

**2. CalendrierBeneficiairesManager : le `montant_total` affiche dans le formulaire d'ajout est absent**

Quand on ajoute un beneficiaire via le dialog (lignes 520-576), le formulaire ne montre pas le montant total prevu. L'utilisateur ne voit pas combien le beneficiaire recevra avant de confirmer. Le `montant_total` est calcule cote DB (colonne generee), donc apres l'insertion.

**Action** : Ajouter un apercu `Montant total prevu : {montant_mensuel_du_membre} x 12 = {total}` dans le dialog d'ajout, calcule localement a partir de `cotisationsMensuelles`.

**3. CalendrierBeneficiairesManager : pas de recalcul du calendrier apres modification de mois**

Quand un admin change le mois de benefice d'un membre, les rangs ne sont pas automatiquement reordonnes pour suivre l'ordre chronologique des mois. Exemple : si le membre rang 3 (Mars) est deplace en Janvier, il devrait passer rang 1.

**Action** : Apres `handleMoisChange`, ajouter une logique optionnelle de tri automatique des rangs par `mois_benefice` croissant. Proposer a l'admin via une confirmation : "Voulez-vous reordonner automatiquement les rangs selon les mois ?"

**4. Exercice cloture : verrouillage partiel**

Ligne 171 : `isLocked = selectedExerciceData?.statut === 'cloture'` — mais ligne 348 : `if (isLocked && !isAdmin) return;` — un admin peut modifier meme un exercice cloture. C'est un comportement voulu mais pas documente. Le PDF exporte montre "Exercice cloture (lecture seule)" (ligne 452) meme si l'admin peut modifier.

**Action** : Aucune correction necessaire, comportement coherent (admin peut debloquer). Le badge "lecture seule" est correct pour les non-admins.

---

## Fichiers a modifier (Phase 3)

| Fichier | Modification | Impact |
|---|---|---|
| `src/components/config/CalendrierBeneficiairesManager.tsx` | Apercu montant total dans dialog d'ajout | UX : visibilite du montant avant confirmation |
| `src/components/config/CalendrierBeneficiairesManager.tsx` | Tri auto des rangs apres changement de mois (optionnel avec confirmation) | UX : coherence mois/rang |
| Edge Function `send-calendrier-beneficiaires` | Test et validation du deploiement | Fiabilite des notifications email |

## Ce qui n'est PAS modifie
- `beneficiairesCalculs.ts` — calculs de solde net corrects
- `useCalendrierBeneficiaires.ts` — hooks CRUD complets et fonctionnels
- `Beneficiaires.tsx` (page admin) — page epargnants/benefices distincte, pas liee au calendrier mensuel
- Base de donnees — colonne `montant_total` generee automatiquement, rien a changer
- `email-utils.ts` — gestion multi-services (Resend + SMTP) complete

