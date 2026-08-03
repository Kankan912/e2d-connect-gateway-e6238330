import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, AlertCircle } from 'lucide-react';
import type { ClotureController } from './useClotureReunion';

export function ClotureChecksCard({ c }: { c: ClotureController }) {
  const rows = [
    { label: 'Membres présents enregistrés', count: c.presentsCount },
    { label: "Points à l'ordre du jour", count: c.pointsCRCount },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Vérifications</CardTitle>
        <CardDescription>Assurez-vous que toutes les conditions sont remplies</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {rows.map((row) => (
          <div key={row.label} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {row.count > 0 ? (
                <CheckCircle className="h-4 w-4 text-primary" />
              ) : (
                <AlertCircle className="h-4 w-4 text-destructive" />
              )}
              <span className="text-sm">{row.label}</span>
            </div>
            <Badge variant={row.count > 0 ? 'default' : 'destructive'}>{row.count}</Badge>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
