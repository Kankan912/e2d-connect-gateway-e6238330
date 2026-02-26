

# Refactoring: Reunions.tsx into feature-based slices

## Current state
`src/pages/Reunions.tsx` is 1339 lines containing 9 tab contents, inline components (`RappelsTab`, `CotisationsTabContent`, `StatCard`), data loading, CRUD handlers, and modal management — all in one file.

## Target structure

```text
src/pages/reunions/
├── index.tsx                    (~120 lines) — Main shell: header, stats, tabs routing, modals
├── types.ts                     (~15 lines)  — Reunion interface
├── components/
│   ├── ReunionsListTab.tsx       (~220 lines) — Table with search, status badges, action buttons
│   ├── CotisationsTab.tsx       (~180 lines) — Exercise selector, reunion picker, grid/comparative views
│   ├── PresencesTab.tsx         (~50 lines)  — Reunion selector + ReunionPresencesManager
│   ├── SanctionsTab.tsx         (~50 lines)  — Reunion selector + ReunionSanctionsManager
│   ├── BeneficiairesTab.tsx     (~80 lines)  — Reunion selector + widget + CalendrierBeneficiairesManager
│   ├── RappelsTab.tsx           (~170 lines) — Email reminder config (extracted as-is from lines 70-291)
│   ├── RecapitulatifsTab.tsx    (~30 lines)  — Monthly/annual sub-tabs
│   ├── HistoriqueTab.tsx        (~30 lines)  — Member history placeholder card
│   └── ReunionStatCards.tsx     (~60 lines)  — 4 stat cards
└── hooks/
    └── useReunionsData.ts       (~80 lines)  — loadReunions, CRUD handlers, filtering, member map
```

## Changes

### 1. Create `src/pages/reunions/types.ts`
Extract the `Reunion` interface (lines 528-539).

### 2. Create `src/pages/reunions/hooks/useReunionsData.ts`
Extract from the main component:
- `loadReunions` function (lines 578-601)
- `handleEdit`, `handleDelete`, `handleCompteRendu`, `handleViewCompteRendu`, form success handlers (lines 603-644)
- `filteredReunions` logic (lines 642-645)
- `membresMap` and `getMemberName` (lines 563-572)
- Stats computations (lines 735-742)
- All related state (`reunions`, `loading`, `searchTerm`, `selectedReunion`, modal states)

Returns all state + handlers as a single hook.

### 3. Create tab components (8 files)
Each receives only needed props from the hook. All existing child components (`ReunionPresencesManager`, `CotisationsGridView`, etc.) remain unchanged.

- **ReunionsListTab**: Lines 835-1053 (table + search + action buttons + `getStatutBadge`)
- **CotisationsTab**: Lines 293-526 (current `CotisationsTabContent`, moved to its own file)
- **PresencesTab**: Lines 1063-1095
- **SanctionsTab**: Lines 1132-1166
- **BeneficiairesTab**: Lines 1168-1224
- **RappelsTab**: Lines 70-291 (current inline `RappelsTab` function)
- **RecapitulatifsTab**: Lines 1101-1114
- **HistoriqueTab**: Lines 1116-1130
- **ReunionStatCards**: Lines 647-669 + 766-792

### 4. Rewrite `src/pages/reunions/index.tsx`
- Import `useReunionsData` hook
- Render header, stat cards, `<Tabs>` shell with lazy-loaded tab contents
- Render modals (Dialog, ClotureReunionModal, ReouvrirReunionModal, NotifierReunionModal, CompteRenduViewer)
- ~120 lines total

### 5. Update `src/App.tsx`
Change the import path from `src/pages/Reunions` to `src/pages/reunions` (the index.tsx will be auto-resolved).

### 6. Delete old `src/pages/Reunions.tsx`
After all references are updated.

## What stays unchanged
- All child components (`ReunionPresencesManager`, `CotisationsGridView`, `CalendrierBeneficiairesManager`, etc.)
- All hooks (`usePermissions`, `useMembers`, `useBackNavigation`)
- All form components (`ReunionForm`, `CompteRenduForm`)
- All modal components (`ClotureReunionModal`, `ReouvrirReunionModal`, `NotifierReunionModal`)
- Routing structure in App.tsx (same path, different import)

