import { usePhoenixEntrainements } from "@/hooks/useSport";
import { DataTable } from "@/components/admin/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Dumbbell } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const EntrainementsAdmin = () => {
  const { data: entrainements, isLoading } = usePhoenixEntrainements();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Dumbbell className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Entraînements Phoenix</h1>
          <p className="text-muted-foreground">Gestion des entraînements et présences</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Entraînements</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{entrainements?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Ce Mois</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {entrainements?.filter(
                (e) =>
                  new Date(e.date_entrainement).getMonth() === new Date().getMonth()
              ).length || 0}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Entraînements</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={entrainements || []}
            columns={[
              {
                key: "date_entrainement",
                label: "Date",
                render: (item) =>
                  format(new Date(item.date_entrainement), "dd MMM yyyy", { locale: fr }),
              },
              {
                key: "heure_debut",
                label: "Heure Début",
                render: (item) => item.heure_debut || "-",
              },
              {
                key: "heure_fin",
                label: "Heure Fin",
                render: (item) => item.heure_fin || "-",
              },
              {
                key: "lieu",
                label: "Lieu",
                render: (item) => item.lieu || "-",
              },
            ]}
            searchable
            emptyMessage="Aucun entraînement enregistré"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default EntrainementsAdmin;
