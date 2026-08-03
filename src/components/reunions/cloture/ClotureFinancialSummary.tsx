import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Wallet, Receipt, AlertTriangle, Gift, CheckCircle } from 'lucide-react';
import { useMoney } from '@/hooks/useCurrencyFormatter';
import type { ClotureController } from './useClotureReunion';

/* eslint-disable @typescript-eslint/no-explicit-any */

export function ClotureFinancialSummary({ c }: { c: ClotureController }) {
  const money = useMoney();

  return (
    <Card className="border-primary/20 bg-primary/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-base flex items-center gap-2">
          <Wallet className="h-4 w-4 text-primary" />
          Résumé Financier
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Receipt className="h-4 w-4 text-primary" />
            <span className="text-sm">Cotisations collectées</span>
          </div>
          <div className="text-right">
            <span className="font-bold text-primary">{money(c.totalCotisations)}</span>
            <span className="text-xs text-muted-foreground ml-1">
              ({c.nbCotisations} paiement{c.nbCotisations > 1 ? 's' : ''})
            </span>
          </div>
        </div>

        {c.membresNonMarques.length > 0 && c.sanctionConfig && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm">Sanctions absence</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-destructive">
                {money(c.membresNonMarques.length * c.sanctionConfig.montant)}
              </span>
              <span className="text-xs text-muted-foreground ml-1">
                ({c.membresNonMarques.length} × {c.sanctionConfig.montant.toLocaleString()})
              </span>
            </div>
          </div>
        )}

        {c.membresSansHuileSavon.length > 0 && c.sanctionHuileSavonConfig && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              <span className="text-sm">Sanctions Huile &amp; Savon</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-destructive">
                {money(c.membresSansHuileSavon.length * c.sanctionHuileSavonConfig.montant)}
              </span>
              <span className="text-xs text-muted-foreground ml-1">
                ({c.membresSansHuileSavon.length} × {c.sanctionHuileSavonConfig.montant.toLocaleString()})
              </span>
            </div>
          </div>
        )}

        {c.beneficiairesReunion && c.beneficiairesReunion.length > 0 && (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-primary" />
              <span className="text-sm">Bénéficiaires du mois</span>
            </div>
            <div className="text-right">
              <span className="font-bold text-primary">
                {money(
                  c.beneficiairesReunion.reduce((sum: number, b: any) => sum + (b.montant_final || 0), 0),
                )}
              </span>
              <span className="text-xs text-muted-foreground ml-1">
                ({c.beneficiairesReunion.filter((b: any) => b.statut === 'paye').length}/
                {c.beneficiairesReunion.length} payé)
              </span>
            </div>
          </div>
        )}

        <div className="pt-2 border-t text-xs text-muted-foreground flex items-center gap-1">
          <CheckCircle className="h-3 w-3 text-primary" />
          Ces montants seront synchronisés automatiquement avec la caisse
        </div>
      </CardContent>
    </Card>
  );
}
