import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { useUserPrets } from "@/hooks/usePersonalData";
import { Wallet, CircleDollarSign, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const MyPrets = () => {
  const { data: prets, isLoading, error } = useUserPrets();

  const getPretsEnCours = () => {
    if (!prets) return { count: 0, total: 0 };
    const enCours = prets.filter(p => p.statut === 'en_cours' || p.statut === 'approuve');
    return {
      count: enCours.length,
      total: enCours.reduce((sum, p) => sum + ((p.montant || 0) - (p.montant_paye || 0)), 0)
    };
  };

  const getStatusBadge = (statut: string) => {
    switch (statut) {
      case 'rembourse':
        return (
          <Badge className="bg-green-500 flex items-center gap-1 w-fit">
            <CheckCircle className="h-3 w-3" />
            Remboursé
          </Badge>
        );
      case 'en_cours':
        return (
          <Badge className="bg-blue-500 flex items-center gap-1 w-fit">
            <Clock className="h-3 w-3" />
            En cours
          </Badge>
        );
      case 'approuve':
        return (
          <Badge className="bg-cyan-500 flex items-center gap-1 w-fit">
            Approuvé
          </Badge>
        );
      case 'en_attente':
        return (
          <Badge variant="secondary" className="flex items-center gap-1 w-fit">
            En attente
          </Badge>
        );
      case 'refuse':
        return (
          <Badge variant="destructive" className="flex items-center gap-1 w-fit">
            Refusé
          </Badge>
        );
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  const pretsEnCours = getPretsEnCours();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mes Prêts</h1>
        <p className="text-muted-foreground mt-2">
          Historique de vos prêts et remboursements
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="border-l-4 border-l-blue-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Wallet className="h-4 w-4 text-blue-500" />
              Prêts en cours
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {pretsEnCours.count}
            </div>
            {pretsEnCours.count > 0 && (
              <p className="text-sm text-muted-foreground mt-1">
                Reste à rembourser: {pretsEnCours.total.toLocaleString('fr-FR')} FCFA
              </p>
            )}
          </CardContent>
        </Card>
        <Card className="border-l-4 border-l-gray-500">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <CircleDollarSign className="h-4 w-4" />
              Total des prêts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">
              {prets?.length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Historique des Prêts
          </CardTitle>
          <CardDescription>
            Vos demandes de prêts et leur état de remboursement
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
              <Wallet className="h-12 w-12 mx-auto text-destructive mb-4" />
              <p className="text-destructive">
                Erreur lors du chargement des prêts
              </p>
            </div>
          ) : !prets || prets.length === 0 ? (
            <div className="text-center py-12">
              <Wallet className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Aucun prêt enregistré pour le moment
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead>Remboursement</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prets.map((pret) => {
                  const montant = pret.montant || 0;
                  const rembourse = pret.montant_paye || 0;
                  const pourcentage = montant > 0 ? Math.round((rembourse / montant) * 100) : 0;
                  
                  return (
                    <TableRow key={pret.id}>
                      <TableCell>
                        {format(new Date(pret.date_pret), 'dd/MM/yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell className="text-right font-medium">
                        {montant.toLocaleString('fr-FR')} FCFA
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span>{rembourse.toLocaleString('fr-FR')} FCFA</span>
                            <span>{pourcentage}%</span>
                          </div>
                          <Progress value={pourcentage} className="h-2" />
                        </div>
                      </TableCell>
                      <TableCell>
                        {pret.echeance 
                          ? format(new Date(pret.echeance), 'dd/MM/yyyy', { locale: fr })
                          : '-'
                        }
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(pret.statut)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default MyPrets;
