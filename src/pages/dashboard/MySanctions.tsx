import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserSanctions } from "@/hooks/usePersonalData";
import { AlertTriangle, XCircle, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const MySanctions = () => {
  const { data: sanctions, isLoading, error } = useUserSanctions();

  const getImpayees = () => {
    if (!sanctions) return { count: 0, total: 0 };
    const impayees = sanctions.filter(s => s.statut !== 'payee');
    return {
      count: impayees.length,
      total: impayees.reduce((sum, s) => sum + ((s.montant || 0) - (s.montant_paye || 0)), 0)
    };
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'payee':
        return (
          <Badge className="bg-green-500 flex items-center gap-1 w-fit">
            <CheckCircle className="h-3 w-3" />
            Payée
          </Badge>
        );
      case 'impayee':
        return (
          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
            <XCircle className="h-3 w-3" />
            Impayée
          </Badge>
        );
      case 'partielle':
        return (
          <Badge className="bg-orange-500 flex items-center gap-1 w-fit">
            <AlertTriangle className="h-3 w-3" />
            Partielle
          </Badge>
        );
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const impayees = getImpayees();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Mes Sanctions</h1>
        <p className="text-muted-foreground mt-2">
          Historique de vos sanctions et pénalités
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-l-4 border-l-gray-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Total Sanctions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl sm:text-3xl font-bold">
              {sanctions?.length || 0}
            </div>
          </CardContent>
        </Card>
        <Card className={`border-l-4 ${impayees.count > 0 ? 'border-l-red-500' : 'border-l-green-500'}`}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <XCircle className={`h-4 w-4 ${impayees.count > 0 ? 'text-red-500' : 'text-green-500'}`} />
              Sanctions Impayées
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl sm:text-3xl font-bold ${impayees.count > 0 ? 'text-red-600' : 'text-green-600'}`}>
              {impayees.count > 0 ? (
                <>
                  {impayees.count} ({impayees.total.toLocaleString('fr-FR')} FCFA)
                </>
              ) : (
                'Aucune'
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {impayees.count > 0 && (
        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4">
          <div className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            <span className="font-medium">
              Vous avez {impayees.count} sanction(s) impayée(s) pour un total de {impayees.total.toLocaleString('fr-FR')} FCFA
            </span>
          </div>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Historique des Sanctions
          </CardTitle>
          <CardDescription>
            Vos sanctions et pénalités dans l'association
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
              <AlertTriangle className="h-12 w-12 mx-auto text-destructive mb-4" />
              <p className="text-destructive">
                Erreur lors du chargement des sanctions
              </p>
            </div>
          ) : !sanctions || sanctions.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <p className="text-muted-foreground">
                Aucune sanction enregistrée - Félicitations !
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Contexte</TableHead>
                  <TableHead>Motif</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-right">Payé</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sanctions.map((sanction) => (
                  <TableRow key={sanction.id}>
                    <TableCell>
                      {format(new Date(sanction.date_sanction), 'dd/MM/yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{sanction.contexte_sanction}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {sanction.motif || '-'}
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {(sanction.montant || 0).toLocaleString('fr-FR')} FCFA
                    </TableCell>
                    <TableCell className="text-right">
                      {(sanction.montant_paye || 0).toLocaleString('fr-FR')} FCFA
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(sanction.statut)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MySanctions;
