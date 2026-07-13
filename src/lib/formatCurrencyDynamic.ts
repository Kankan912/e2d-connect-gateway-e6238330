/**
 * Phase 6 — formatCurrency dynamique lié à l'association courante.
 *
 * Lit `currency_code` depuis `associations.theme_tokens.currency_code`
 * (extension légère, sans nouvelle table) avec fallback FCFA.
 * Voir `formatFCFA` dans `src/lib/utils.ts` : la valeur par défaut reste FCFA
 * conformément à la mémoire projet.
 */
import { formatCurrency } from "@/lib/utils";

export type CurrencyCode = "FCFA" | "XOF" | "EUR" | "USD";

export function resolveCurrency(themeTokens?: Record<string, string> | null): CurrencyCode {
  const raw = themeTokens?.currency_code?.toUpperCase();
  if (raw === "EUR" || raw === "USD") return raw;
  // XOF (code ISO officiel) est traité comme FCFA pour l'affichage.
  return "FCFA";
}

export function formatCurrencyForAssociation(
  amount: number,
  themeTokens?: Record<string, string> | null,
  locale?: string,
): string {
  const currency = resolveCurrency(themeTokens);
  const loc = locale ?? themeTokens?.locale ?? "fr-FR";
  return formatCurrency(amount, currency === "XOF" ? "FCFA" : currency, loc);
}
