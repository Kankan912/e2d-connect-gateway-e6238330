import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as currency
 * @param amount - The amount to format
 * @param currency - Currency code: 'FCFA' (default), 'EUR', 'USD'
 * @param locale - Locale for formatting (default: 'fr-FR')
 */
export function formatCurrency(
  amount: number,
  currency: 'FCFA' | 'EUR' | 'USD' = 'FCFA',
  locale: string = 'fr-FR'
): string {
  if (currency === 'FCFA') {
    // FCFA n'admet aucune décimale : on plancher systématiquement.
    const safe = Math.floor(Number(amount) || 0);
    return `${safe.toLocaleString(locale)} FCFA`;
  }
  
  const currencyMap: Record<string, string> = {
    'EUR': 'EUR',
    'USD': 'USD',
  };
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currencyMap[currency],
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

/**
 * Devise active du tenant courant.
 * Renseignée par `AssociationContext` à chaque changement d'association
 * (`theme_tokens.currency_code` / `theme_tokens.locale`).
 * Permet à `formatFCFA()` — utilisé dans une soixantaine de fichiers et
 * dans les exports PDF hors React — de rester cohérent en multi-tenant
 * sans refactor massif.
 */
let activeCurrency: 'FCFA' | 'EUR' | 'USD' = 'FCFA';
let activeLocale = 'fr-FR';

export function setActiveCurrency(
  currency: 'FCFA' | 'EUR' | 'USD' | null | undefined,
  locale?: string | null,
): void {
  activeCurrency = currency ?? 'FCFA';
  activeLocale = locale ?? 'fr-FR';
}

export function getActiveCurrency(): { currency: 'FCFA' | 'EUR' | 'USD'; locale: string } {
  return { currency: activeCurrency, locale: activeLocale };
}

/**
 * Format d'un montant dans la devise active du tenant (FCFA par défaut).
 * Dans un composant React, préférer `useCurrencyFormatter()` / `useMoney()`.
 */
export function formatFCFA(amount: number): string {
  return formatCurrency(amount, activeCurrency, activeLocale);
}

/**
 * Safely extract an error message from an unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Une erreur inattendue est survenue';
}
