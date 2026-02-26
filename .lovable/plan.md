

# Remaining items from Architecture audit

## Already completed (previous sessions)
- ✅ `useCaisseDetails` + `useCaisseSynthese` merged into `useCaisse.ts`
- ✅ `useMemberDetails` merged into `useMembers.ts`
- ✅ `useSupabaseQuery` and `useSupabaseMutation` generic hooks created
- ✅ `docs/ARCHITECTURE.md`, `HOOKS_REFERENCE.md`, `DATABASE_SCHEMA.md`, `RLS_PERMISSIONS.md`, `CONTRIBUTING.md` created
- ✅ `README.md` updated with Quick Start and doc links

## Still to do

### 1. Create `src/hooks/generic/useSupabaseRealtime.ts`
Thin wrapper around the existing `useRealtimeUpdates` that integrates with React Query cache invalidation. Accepts `table`, `queryKeys` to invalidate, and optional `event` filter.

### 2. Add JSDoc to existing public hooks
Add `@param`, `@returns`, `@example` to the most-used hooks: `useCaisse`, `useMembers`, `useReunions`, `useCotisations`, `usePermissions`, `useRoles`, `useAides`, `useEpargnes`.

### 3. Update `docs/HOOKS_REFERENCE.md`
Add the new `useSupabaseRealtime` hook documentation and update examples for consolidated hooks.

### Implementation steps
1. Create `src/hooks/generic/useSupabaseRealtime.ts` (~30 lines)
2. Add JSDoc comments to 8 domain hooks
3. Update `docs/HOOKS_REFERENCE.md` with realtime hook docs

