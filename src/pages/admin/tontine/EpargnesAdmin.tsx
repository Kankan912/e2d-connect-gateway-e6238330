import { useAllEpargnes } from "@/hooks/useTontine";
import { DataTable } from "@/components/admin/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, PiggyBank } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const EpargnesAdmin = () => {
  const { data: epargnes, isLoading } = useAllEpargnes();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalEpargnes = epargnes?.reduce((sum, e) => sum + Number(e.montant), 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <PiggyBank className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Gestion des Épargnes</h1>
          <p className="text-muted-foreground">Suivi des épargnes de la tontine</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Épargnes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalEpargnes.toLocaleString()} FCFA</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Nombre de Dépôts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{epargnes?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Membres Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Set(epargnes?.map((e) => e.membre_id)).size}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Épargnes</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={epargnes || []}
            columns={[
              {
                key: "membre",
                label: "Membre",
                render: (item) =>
                  item.membre ? `${item.membre.prenom} ${item.membre.nom}` : "-",
              },
              {
                key: "montant",
                label: "Montant",
                render: (item) => `${Number(item.montant).toLocaleString()} FCFA`,
              },
              {
                key: "date_depot",
                label: "Date",
                render: (item) =>
                  format(new Date(item.date_depot), "dd MMM yyyy", { locale: fr }),
              },
              {
                key: "statut",
                label: "Statut",
                render: (item) => (
                  <Badge variant={item.statut === "actif" ? "default" : "secondary"}>
                    {item.statut}
                  </Badge>
                ),
              },
            ]}
            searchable
            emptyMessage="Aucune épargne enregistrée"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default EpargnesAdmin;
