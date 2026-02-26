

# Plan: Hook consolidation + Technical documentation

## Part 1: Hook architecture improvement

After analyzing the hooks, the "duplication" is more about **organizational sprawl** than true code duplication. Each hook serves a distinct purpose with different queries, joins, and business logic. Creating fully generic `useSupabaseQuery`/`useSupabaseMutation` hooks would lose type safety and domain specificity.

**Pragmatic approach**: Consolidate closely related hooks into single files with view parameters, without creating overly abstract generic wrappers.

### Changes

#### 1. Merge `useCaisseDetails.ts` + `useCaisseSynthese.ts` into `useCaisse.ts`

Move `useCaisseDetails`, `useCaisseSynthese`, `getDetailTitle` exports into `useCaisse.ts`. Delete the two separate files. Update all imports (approximately 3-4 component files).

#### 2. Merge `useMemberDetails.ts` into `useMembers.ts`

Move `useMemberDetails` and its interfaces into `useMembers.ts`. Delete `useMemberDetails.ts`. Update imports (approximately 2 component files).

#### 3. Create `src/hooks/generic/useSupabaseQuery.ts` — lightweight helper

A thin wrapper around `useQuery` + `supabase.from(table).select()` for simple cases only. Not intended to replace domain hooks, but to reduce boilerplate for new features.

```typescript
export function useSupabaseQuery<T>(
  table: string, 
  queryKey: string[], 
  options?: { select?: string; filters?: Record<string, any>; enabled?: boolean; orderBy?: string }
)
```

#### 4. Create `src/hooks/generic/useSupabaseMutation.ts` — lightweight helper

Wraps `useMutation` for simple insert/update/delete with automatic cache invalidation.

### Files to update imports

- `src/components/caisse/CaisseDashboard.tsx`
- `src/components/caisse/CaisseSidePanel.tsx`
- `src/components/caisse/CaisseSyntheseDetailModal.tsx`
- `src/components/MemberDetailSheet.tsx`
- Any other files importing from the deleted hooks

---

## Part 2: Technical documentation

### Files to create

1. **`docs/ARCHITECTURE.md`** — Project structure overview: folder conventions, feature-based slices, hook patterns, Supabase integration, auth flow
2. **`docs/HOOKS_REFERENCE.md`** — Table of all hooks with purpose, parameters, return values, and usage examples (grouped by domain: caisse, members, reunions, sport, etc.)
3. **`docs/DATABASE_SCHEMA.md`** — Mermaid ERD diagram of key tables and relationships, generated from current schema
4. **`docs/RLS_PERMISSIONS.md`** — Summary of RLS policies, roles (`is_admin`, `has_permission`, `has_role`), and which resources require which permissions
5. **`docs/CONTRIBUTING.md`** — How to add a new feature: create hook, component, page, update routing
6. **`README.md`** — Update with Quick Start section and links to all docs

### Not implemented (requires external tooling)
- Storybook (requires `npx storybook init`, not feasible in Lovable)
- TypeDoc generation
- Chromatic/GitHub Pages deployment

