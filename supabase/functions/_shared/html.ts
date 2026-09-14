/**
 * Échappement HTML pour toute valeur provenant d'un utilisateur avant insertion
 * dans un email (A16). À utiliser systématiquement dans les templates.
 */
export function escapeHtml(value: unknown): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Échappement d'une liste, puis jointure. */
export function escapeList(values: unknown[], sep = ", "): string {
  return (values ?? []).map(escapeHtml).join(sep);
}
