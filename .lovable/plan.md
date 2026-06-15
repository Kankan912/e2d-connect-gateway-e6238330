## Lot 4 — Notifications in-app personnelles ✅

Implémenté : centre de notifications par utilisateur avec temps réel, marquage lu, navigation.

### Livré

**Base de données**
- Table `public.notifications` (RLS, trigger anti-altération, indexes, dédoublonnage via `metadata.dedupe_key`)
- Publication `supabase_realtime` activée + REPLICA IDENTITY FULL
- RPC `mark_all_notifications_read()`

**Helper Edge partagé**
- `supabase/functions/_shared/in-app-notify.ts` — `notifyInApp` / `notifyManyInApp`, jamais throw, gère 23505 (dédoublonnage)

**Edge functions instrumentées**
- `send-loan-notification` : ajout event `disbursed`, notif in-app pour validateurs (created/cancelled) et demandeur (step_validated/rejected/final_approved/disbursed)
- `send-sanction-notification` : notif in-app pour le membre sanctionné
- `send-pret-echeance-reminders` : notif in-app par jour pour échéance proche / en retard

**Frontend**
- `useInAppNotifications` — query + realtime + mark/markAll
- `NotificationItemPersonal` — composant item personnel (point bleu non-lu, navigation)
- `NotificationCenter` — deux sections « Mes notifications » + « Alertes système », badge unifié, bouton "Tout marquer lu"
- `NotificationToaster` — toast realtime sur INSERT de notifications + bouton "Voir"
- `useDisburseLoan` — déclenche `notifyEvent("disbursed")`

### Validation
- `tsc --noEmit` propre
- Migration Supabase appliquée sans erreur liée au lot

### Hors périmètre (confirmé)
- Pas de préférences utilisateur opt-in/out
- Pas de push web / FCM
- Pas de digest / groupement
- `process-adhesion` non instrumenté (pas de compte utilisateur encore créé à ce stade)
