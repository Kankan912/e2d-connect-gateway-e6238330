## Lot 4 — Notifications in-app personnelles

Le Lot 3.1 étant validé, je propose comme suite naturelle le **Centre de notifications in-app par utilisateur**, explicitement listé hors-périmètre du Lot 3. Aujourd'hui la cloche n'affiche que des alertes admin dérivées (`useAlertesGlobales`) — aucun membre ne voit ses propres événements (validation de prêt, décaissement, sanction, cotisation, etc.) sans aller chercher l'email.

---

### Objectif

Chaque utilisateur (membre ou admin) reçoit en temps réel dans la cloche les événements qui le concernent, peut les marquer lus, et cliquer pour atterrir sur la ressource concernée.

---

### Périmètre fonctionnel

| Source d'événement | Destinataire | Lien de navigation |
|---|---|---|
| Demande de prêt soumise | Validateurs du palier courant | `/admin/demandes-prets` |
| Validation / rejet d'un palier | Demandeur | `/dashboard/mes-demandes-pret` |
| Décaissement effectué | Demandeur | `/dashboard/mes-prets` |
| Annulation par le membre | Validateurs | `/admin/demandes-prets` |
| Sanction créée | Membre sanctionné | `/dashboard/mes-sanctions` |
| Échéance de prêt proche / en retard | Emprunteur | `/dashboard/mes-prets` |
| Adhésion validée / rejetée | Demandeur | `/dashboard/profile` |

Les emails existants ne sont **pas** remplacés ; les notifications in-app les doublent.

---

### Architecture technique

#### A. Base de données — migration unique

Table `public.notifications` :
- `id uuid pk`, `user_id uuid not null` (FK `auth.users`)
- `type text not null` (énum logique : `loan_request_submitted`, `loan_validated`, `loan_rejected`, `loan_disbursed`, `loan_cancelled`, `sanction_created`, `loan_due_soon`, `loan_overdue`, `adhesion_processed`)
- `title text`, `body text`
- `link text` (route SPA)
- `metadata jsonb` (ids ressource pour deep-link)
- `read_at timestamptz`, `created_at timestamptz default now()`
- Index `(user_id, read_at, created_at desc)`

`GRANT` :
- `select, update` (read_at uniquement via policy) à `authenticated`
- `all` à `service_role`

RLS :
- `select` : `auth.uid() = user_id`
- `update` : `auth.uid() = user_id` (limité au champ `read_at` par trigger `BEFORE UPDATE` qui rejette toute autre modif)
- pas d'`insert` client (seules les fonctions Edge écrivent en `service_role`)

Publication realtime : ajout de `notifications` à `supabase_realtime`.

#### B. Helper Edge partagé

`supabase/functions/_shared/in-app-notify.ts` :
```ts
export async function notifyInApp(supabase, { user_id, type, title, body, link, metadata }) { … }
```
Insertion idempotente (clé `type + metadata.request_id` quand pertinent) pour éviter les doublons en cas de retries.

#### C. Branchement dans les fonctions Edge existantes

Modifier `send-loan-notification`, `send-sanction-notification`, `send-pret-echeance-reminders`, `process-adhesion` pour appeler `notifyInApp` **en plus** de l'envoi email, sans bloquer si l'insert échoue (`try/catch + logger.error`).

#### D. Frontend

- **Nouveau hook** `src/hooks/useInAppNotifications.ts` :
  - `useNotifications()` → query paginée + count non lus
  - `useMarkAsRead(id)` / `useMarkAllAsRead()`
  - Channel realtime `notifications:user_id=eq.${uid}` → invalide la query
- **Refonte `NotificationCenter.tsx`** :
  - Deux sections dans le dropdown : **« Mes notifications »** (nouveau hook) puis **« Alertes système »** (`useAlertesGlobales` actuel, conservé pour les admins)
  - Badge cloche = `unread_count + nombreCritiques`
  - Bouton "Tout marquer lu"
- **Nouveau composant** `NotificationItemPersonal.tsx` : titre, body, time-ago, point bleu si non lu, clic → `navigate(link)` + `markAsRead`
- `NotificationToaster.tsx` : déclenche un toast sur chaque nouvel item realtime (déjà presque en place, à reconnecter sur le nouveau channel)

---

### Hors périmètre

- Pas de préférences utilisateur (opt-in/out par type) — phase ultérieure
- Pas de push web / FCM
- Pas de purge automatique (ajout d'un cron plus tard si volumétrie le justifie)
- Pas de notifications groupées / digest

---

### Fichiers impactés

**Création**
- `supabase/migrations/<ts>_notifications_in_app.sql`
- `supabase/functions/_shared/in-app-notify.ts`
- `src/hooks/useInAppNotifications.ts`
- `src/components/notifications/NotificationItemPersonal.tsx`

**Modification**
- `supabase/functions/send-loan-notification/index.ts`
- `supabase/functions/send-sanction-notification/index.ts`
- `supabase/functions/send-pret-echeance-reminders/index.ts`
- `supabase/functions/process-adhesion/index.ts`
- `src/components/notifications/NotificationCenter.tsx`
- `src/components/notifications/NotificationToaster.tsx`
- `src/integrations/supabase/types.ts` (auto)

---

### Validation

- `tsc --noEmit` propre
- Linter Supabase RLS propre
- Scénarios E2E manuels :
  1. Soumettre demande → cloche des validateurs incrémente en temps réel + toast
  2. Valider un palier → cloche du membre incrémente, clic → atterrissage sur `/dashboard/mes-demandes-pret`
  3. Décaisser → notif "Prêt décaissé" reçue + clic vers `/dashboard/mes-prets`
  4. Marquer tout lu → badge à zéro
  5. Reconnexion → notifs persistées (table, pas mémoire)
  6. Rafraîchir alors qu'un autre onglet marque lu → badge se met à jour
