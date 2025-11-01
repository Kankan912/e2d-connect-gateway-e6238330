import type { PaymentMethod, DonationCurrency } from "@/types/donations";

export const PRESET_AMOUNTS = [
  { value: 10, label: "10€", badge: "Supporter" },
  { value: 25, label: "25€", badge: "Contributeur" },
  { value: 50, label: "50€", badge: "Bienfaiteur" },
  { value: 100, label: "100€", badge: "Mécène" },
  { value: 200, label: "200€", badge: "Grand Mécène" },
];

export const ADHESION_TARIFS = {
  e2d: { amount: 20, label: "Adhésion E2D" },
  phoenix: { amount: 30, label: "Adhésion Phoenix" },
  both: { amount: 45, label: "Adhésion E2D + Phoenix" },
};

export const CURRENCIES: { value: DonationCurrency; label: string; symbol: string }[] = [
  { value: 'EUR', label: 'Euro', symbol: '€' },
  { value: 'USD', label: 'Dollar US', symbol: '$' },
  { value: 'GBP', label: 'Livre Sterling', symbol: '£' },
  { value: 'CAD', label: 'Dollar Canadien', symbol: 'CA$' },
  { value: 'CHF', label: 'Franc Suisse', symbol: 'CHF' },
];

export function formatAmount(amount: number, currency: DonationCurrency = 'EUR'): string {
  const currencyData = CURRENCIES.find(c => c.value === currency);
  return `${amount}${currencyData?.symbol || '€'}`;
}

export function getPaymentMethodLabel(method: PaymentMethod): string {
  const labels: Record<PaymentMethod, string> = {
    stripe: 'Carte Bancaire (Stripe)',
    paypal: 'PayPal',
    helloasso: 'HelloAsso',
    bank_transfer: 'Virement Bancaire',
  };
  return labels[method];
}

export function getPaymentMethodIcon(method: PaymentMethod): string {
  const icons: Record<PaymentMethod, string> = {
    stripe: '💳',
    paypal: '🅿️',
    helloasso: '🇫🇷',
    bank_transfer: '🏦',
  };
  return icons[method];
}