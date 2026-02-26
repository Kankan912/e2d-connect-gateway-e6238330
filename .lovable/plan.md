

# Fix: Group beneficiaries by month in calendar display

## Problem
The calendar table renders one row per beneficiary, causing month name duplication when multiple beneficiaries share a month (e.g., "Décembre" appears 3 times).

## Solution
Replace the flat 1-row-per-beneficiary table with a grouped 1-row-per-month table. Each month row shows all its beneficiaries as `Badge` components in a single cell. Individual editing (delete, amount change, month reassignment) is preserved via per-badge actions.

## Changes

### 1. `src/components/config/CalendrierBeneficiairesManager.tsx`

**Remove** the `SortableBeneficiaireRow` component and replace the table rendering with a month-grouped view:

- Group `calendrier` by `mois_benefice` using a reduce/Map
- Render 12 month rows (+ 1 "Non attribué" row for `null` months)
- Each row shows:
  - Month name (single occurrence)
  - Beneficiary badges with names, wrapped in flexbox (`flex flex-wrap gap-1`)
  - Count badge: "(3 bénéficiaires)"
  - Sum of `montant_mensuel` and `montant_total` for that month
- In admin/editable mode: each badge has an `X` button for deletion, and clicking a badge opens inline editing
- Keep drag-and-drop at the badge level within/between month groups (or simplify to just use the month selector per beneficiary via a popover on badge click)
- Beneficiaries with no month assigned go in a separate "Non attribué" section at the bottom

**New table structure:**
```text
| Mois       | Bénéficiaires                      | Montant Mensuel | Total (×12) | Actions |
|------------|-------------------------------------|-----------------|-------------|---------|
| Janvier    | [Jean Dupont ×] [Marie Martin ×]   | 40 000          | 480 000     | +       |
| Février    | [Paul Bernard ×]                    | 20 000          | 240 000     | +       |
| ...        |                                     |                 |             |         |
| Non défini | [Luc Lefèvre ×]                    | 20 000          | 240 000     | +       |
```

### 2. PDF export update (`handleExportPDF`)

- Group `tableData` by month before generating the autoTable
- Each month row lists beneficiaries separated by `\n` (multi-line cell)
- Aggregate amounts per month

### 3. Keep individual management

- The "Ajouter un bénéficiaire" dialog already supports month selection — no change needed
- Delete confirmation AlertDialog remains as-is, triggered from badge `X` buttons
- Month reassignment: clicking a beneficiary badge in admin mode shows a small popover or inline select to change their month

