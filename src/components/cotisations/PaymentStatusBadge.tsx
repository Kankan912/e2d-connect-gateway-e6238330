import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  CotisationPaymentEngine,
  PAYMENT_STATUS_LABEL,
  type PaymentStatus,
} from '@/domain/finance/CotisationPaymentEngine';

const STATUS_CLASS: Record<PaymentStatus, string> = {
  unpaid: 'bg-destructive/15 text-destructive border-destructive/30',
  partial: 'bg-warning/15 text-warning border-warning/30',
  paid: 'bg-success/15 text-success border-success/30',
};

interface PaymentStatusBadgeProps {
  montantDu: number;
  montantPaye: number;
  /** Affiche le pourcentage payé à côté du libellé */
  showPercent?: boolean;
  className?: string;
}

/**
 * Badge Rouge / Orange / Vert calculé par `CotisationPaymentEngine`.
 * Source unique du statut de paiement — ne jamais recalculer localement.
 */
export function PaymentStatusBadge({
  montantDu,
  montantPaye,
  showPercent = false,
  className,
}: PaymentStatusBadgeProps) {
  const summary = CotisationPaymentEngine.compute(montantDu, montantPaye);
  const percent =
    summary.montant_du > 0
      ? Math.min(100, Math.round((summary.montant_paye / summary.montant_du) * 100))
      : 0;

  return (
    <Badge variant="outline" className={cn(STATUS_CLASS[summary.status], className)}>
      {PAYMENT_STATUS_LABEL[summary.status]}
      {showPercent && ` · ${percent}%`}
    </Badge>
  );
}

export default PaymentStatusBadge;
