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
    return `${amount.toLocaleString(locale)} FCFA`;
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
 * Format a number as FCFA (shorthand)
 */
export function formatFCFA(amount: number): string {
  return formatCurrency(amount, 'FCFA');
}

/**
 * Safely extract an error message from an unknown error type
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Une erreur inattendue est survenue';
}
