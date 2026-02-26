
# Fix: "Invalid time value" crash in ExercicesManager

## Cause

Lines 310-311 and 339-340 in `ExercicesManager.tsx` call `format(new Date(exercice.date_debut), ...)` and `format(new Date(exercice.date_fin), ...)` without checking if the dates are valid. If any exercise in the database has a null or malformed date, `new Date(null)` produces an Invalid Date, and `date-fns format()` throws `RangeError: Invalid time value`.

## Fix

### File: `src/components/config/ExercicesManager.tsx`

Add a safe date formatting helper and use it in all 4 locations:

```typescript
const safeFormat = (dateStr: string | null | undefined, fmt: string, options?: any) => {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "—";
  return format(d, fmt, options);
};
```

Replace:
- Line 310: `format(new Date(activeExercice.date_debut), "d MMMM yyyy", { locale: fr })` → `safeFormat(activeExercice.date_debut, "d MMMM yyyy", { locale: fr })`
- Line 311: `format(new Date(activeExercice.date_fin), "d MMMM yyyy", { locale: fr })` → `safeFormat(activeExercice.date_fin, "d MMMM yyyy", { locale: fr })`
- Line 339: `format(new Date(exercice.date_debut), "dd/MM/yyyy")` → `safeFormat(exercice.date_debut, "dd/MM/yyyy")`
- Line 340: `format(new Date(exercice.date_fin), "dd/MM/yyyy")` → `safeFormat(exercice.date_fin, "dd/MM/yyyy")`

No other files affected. Single file, 5 edits (1 helper + 4 replacements).
