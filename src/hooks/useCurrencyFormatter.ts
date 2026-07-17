/**
 * useCurrencyFormatter — formatage devise lié au tenant courant.
 *
 * Wrapper autour de `formatCurrencyForAssociation` qui lit
 * `theme_tokens.currency_code` de l'association active.
 * Fallback : FCFA (mémoire projet).
 */
import { useCallback } from "react";
import { useAssociation } from "@/contexts/AssociationContext";
import { formatCurrencyForAssociation } from "@/lib/formatCurrencyDynamic";

export function useCurrencyFormatter() {
  const { currentAssociation } = useAssociation();
  const tokens = currentAssociation?.theme_tokens ?? null;

  const format = useCallback(
    (amount: number, locale?: string) =>
      formatCurrencyForAssociation(amount ?? 0, tokens, locale),
    [tokens],
  );

  return { format, tokens };
}
