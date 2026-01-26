import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserCotisations } from "@/hooks/useCotisations";
import { Eye, Receipt } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { formatFCFA } from "@/lib/utils";

const MyCotisations = () => {
  const { data: cotisations, isLoading, error } = useUserCotisations();

  const getTotalPaye = () => {
    if (!cotisations) return 0;
    return cotisations
      .filter(c => c.statut === 'paye')
      .reduce((sum, c) => sum + c.montant, 0);
  };

  const getRecapByType = () => {
    if (!cotisations) return [];
    const recap: { [key: string]: { count: number; total: number } } = {};
    
    cotisations.forEach(c => {
      const typeName = c.type?.nom || 'Non spécifié';
      if (!recap[typeName]) {
        recap[typeName] = { count: 0, total: 0 };
      }
      if (c.statut === 'paye') {
        recap[typeName].count++;
        recap[typeName].total += c.montant;
      }
    });
    
    return Object.entries(recap).map(([type, data]) => ({
      type,
      ...data
    }));
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'paye':
        return <Badge variant="default" className="bg-green-500">Payé</Badge>;
      case 'en_attente':
        return <Badge variant="secondary">En attente</Badge>;
      case 'annule':
        return <Badge variant="destructive">Annulé</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mes Cotisations</h1>
        <p className="text-muted-foreground mt-2">
          Historique de vos cotisations annuelles
        </p>
      </div>

      {/* Récapitulatif par type */}
      {cotisations && cotisations.length > 0 && (
        <div className="grid gap-4 md:grid-cols-3">
          {getRecapByType().map(({ type, count, total }) => (
            <Card key={type} className="border-l-4 border-l-primary">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {type}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-primary">
                  {formatFCFA(total)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {count} paiement{count > 1 ? 's' : ''}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Cotisations</CardTitle>
          <CardDescription>
            Vos paiements de cotisations E2D
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 mx-auto text-destructive mb-4" />
              <p className="text-destructive">
                Erreur lors du chargement des cotisations
              </p>
            </div>
          ) : !cotisations || cotisations.length === 0 ? (
            <div className="text-center py-12">
              <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Aucune cotisation enregistrée pour le moment
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type Cotisation</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {cotisations.map((cotisation) => (
                    <TableRow key={cotisation.id}>
                      <TableCell className="font-medium">
                        {cotisation.type?.nom || 'Non spécifié'}
                      </TableCell>
                      <TableCell className="text-right">
                        {formatFCFA(cotisation.montant)}
                      </TableCell>
                      <TableCell>
                        {format(new Date(cotisation.date_paiement), 'dd/MM/yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(cotisation.statut)}
                      </TableCell>
                      <TableCell className="text-right">
                        {cotisation.justificatif_url && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => window.open(cotisation.justificatif_url, '_blank')}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Voir
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              
              <div className="mt-6 pt-6 border-t border-border">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    Total des cotisations payées
                  </span>
                  <span className="text-xl font-bold text-foreground">
                    {formatFCFA(getTotalPaye())}
                  </span>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MyCotisations;
