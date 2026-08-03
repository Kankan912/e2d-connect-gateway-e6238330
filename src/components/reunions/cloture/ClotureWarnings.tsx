import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertTriangle, AlertCircle, Gift, Users } from 'lucide-react';
import { useMoney } from '@/hooks/useCurrencyFormatter';
import type { ClotureController } from './useClotureReunion';

/* eslint-disable @typescript-eslint/no-explicit-any */

export function ClotureWarnings({ c }: { c: ClotureController }) {
  const money = useMoney();

  return (
    <>
      {c.membresNonMarques.length > 0 && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">{c.membresNonMarques.length} membre(s) non marqué(s)</p>
                <p className="text-muted-foreground">
                  Ces membres seront automatiquement marqués comme <strong>absents non excusés</strong> et
                  recevront une sanction.
                </p>
                <div className="mt-2 text-xs text-muted-foreground">
                  {c.membresNonMarques.slice(0, 5).map((m) => m.prenom + ' ' + m.nom).join(', ')}
                  {c.membresNonMarques.length > 5 && ` et ${c.membresNonMarques.length - 5} autre(s)...`}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {c.beneficiairesImpayes.length > 0 && (
        <Card className="border-primary/50 bg-primary/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <Gift className="h-5 w-5 text-primary mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">
                  {c.beneficiairesImpayes.length} bénéficiaire(s) non payé(s)
                </p>
                <p className="text-muted-foreground">
                  Montant total impayé: <strong>{money(c.totalBeneficiairesImpayes)}</strong>
                </p>
                <div className="mt-2 text-xs text-muted-foreground">
                  {c.beneficiairesImpayes
                    .map((b: any) => `${b.membres?.prenom} ${b.membres?.nom}`)
                    .join(', ')}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {c.membresPresentsSansCotisation.length > 0 && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">
                  {c.membresPresentsSansCotisation.length} membre(s) présent(s) sans cotisation
                </p>
                <p className="text-muted-foreground text-xs mb-2">
                  Ces membres sont marqués présents mais n'ont aucune cotisation enregistrée pour cette
                  réunion.
                </p>
                <div className="flex flex-wrap gap-1">
                  {c.membresPresentsSansCotisation.map((m, i) => (
                    <Badge key={i} variant="outline" className="text-xs">
                      {m.prenom} {m.nom}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {c.presentsCount > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4" />
              Destinataires du CR ({c.presentsCount})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-24">
              <div className="space-y-2">
                {c.presences
                  ?.filter((p) => p.statut_presence === 'present')
                  .map((presence: any, index: number) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted text-sm"
                    >
                      <span>
                        {presence.membres?.prenom} {presence.membres?.nom}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {presence.membres?.email || "Pas d'email"}
                      </span>
                    </div>
                  ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {!c.canClose && (
        <Card className="border-destructive/40 bg-destructive/5">
          <CardContent className="pt-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-5 w-5 text-destructive mt-0.5" />
              <div className="text-sm">
                <p className="font-medium mb-1">Conditions non remplies</p>
                <p className="text-muted-foreground">
                  Veuillez enregistrer au moins un membre présent et un point à l'ordre du jour avant de
                  clôturer la réunion.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
}
