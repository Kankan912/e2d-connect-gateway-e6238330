

# Batch 8 : Console.error residuel + nettoyage `as any` ciblé — TERMINÉ

## Modifications appliquées

| # | Fichier | Action | Statut |
|---|---------|--------|--------|
| 1 | `src/lib/sync-events.ts` (L180) | `console.error` → `logger.error` | ✅ |
| 2 | `src/hooks/useSportEventSync.ts` (L27) | `as any` → `as { id?: string }` sur payload.new/old | ✅ |
| 3 | `src/pages/admin/RolesAdmin.tsx` (L31) | `as any` → type explicite avec interface détaillée | ✅ |

## Notes

- Les `user: any` en aval dans RolesAdmin sont conservés car ils dépendent de la structure jointe complexe — le cast principal est maintenant typé
- Dernier `console.error` résiduel dans sync-events.ts corrigé
- Aucun changement fonctionnel
