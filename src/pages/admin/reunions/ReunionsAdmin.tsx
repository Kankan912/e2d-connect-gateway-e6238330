import { useReunions } from "@/hooks/useReunions";
import { DataTable } from "@/components/admin/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Calendar } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const ReunionsAdmin = () => {
  const { data: reunions, isLoading } = useReunions();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const reunionsAPlanifier = reunions?.filter((r) => r.statut === "planifie").length || 0;
  const reunionsTerminees = reunions?.filter((r) => r.statut === "termine").length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Calendar className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Gestion des Réunions</h1>
          <p className="text-muted-foreground">Planning et organisation des réunions</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Réunions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reunions?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">À Planifier</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reunionsAPlanifier}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Terminées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{reunionsTerminees}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Réunions</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={reunions || []}
            columns={[
              {
                key: "date_reunion",
                label: "Date",
                render: (item) =>
                  format(new Date(item.date_reunion), "dd MMM yyyy à HH:mm", { locale: fr }),
              },
              {
                key: "type_reunion",
                label: "Type",
                render: (item) => <Badge variant="outline">{item.type_reunion}</Badge>,
              },
              {
                key: "sujet",
                label: "Sujet",
                render: (item) => item.sujet || "-",
              },
              {
                key: "lieu_description",
                label: "Lieu",
                render: (item) => item.lieu_description || "-",
              },
              {
                key: "statut",
                label: "Statut",
                render: (item) => (
                  <Badge
                    variant={
                      item.statut === "termine"
                        ? "default"
                        : item.statut === "en_cours"
                        ? "secondary"
                        : "outline"
                    }
                  >
                    {item.statut}
                  </Badge>
                ),
              },
            ]}
            searchable
            emptyMessage="Aucune réunion planifiée"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ReunionsAdmin;
