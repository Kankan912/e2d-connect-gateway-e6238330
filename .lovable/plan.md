# Plan de correction du code review — Exécuté

## Bugs réels corrigés
- **Sécurité storage**: bucket `justificatifs` passé en privé + RLS lecture/écriture restreinte aux admins ou propriétaires.
- **FileUploadField**: refactor pour gérer les buckets privés via URLs signées (10 min) avec rétrocompat des anciennes URLs publiques stockées.
- **Bucket dupliqué**: corrigé l'usage `membre-photos` → `members-photos` dans `MediaLibrary.tsx`.
- **Documentation**: nouveau fichier `docs/SECURITY_DASHBOARD_ACTIONS.md` listant les actions à effectuer manuellement dans le dashboard (OTP, leaked password, upgrade Postgres, suppression bucket dupliqué).

## Hors scope (acceptés / faux positifs linter)
- Buckets publics du site vitrine (`site-*`, `sport-logos`, etc.)
- 80+ warnings `SECURITY DEFINER` sur RPC métier nécessaires (`is_admin`, `has_role`, etc.)
- ~80 `console.*` résiduels: à migrer progressivement vers `logger.*` selon les fichiers réellement modifiés.

## Modules déjà stabilisés (itérations précédentes)
- Email refactor (Resend/SMTP avec fallback)
- Caisse (Math.floor, RPC source unique)
- Prêts (validation reconductions, calculs)
- Cotisations (régénération projection)
- Utilisateurs (vérif email duplicate, atomicité)
- Sport (sync E2D ↔ site_events)
