import { useE2DMatchs } from "@/hooks/useSport";
import { DataTable } from "@/components/admin/DataTable";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trophy } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const E2DMatchsAdmin = () => {
  const { data: matchs, isLoading } = useE2DMatchs();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const victoires = matchs?.filter((m) => m.score_e2d > m.score_adverse).length || 0;
  const defaites = matchs?.filter((m) => m.score_e2d < m.score_adverse).length || 0;
  const nuls = matchs?.filter((m) => m.score_e2d === m.score_adverse && m.statut === "termine").length || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Trophy className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Matchs E2D</h1>
          <p className="text-muted-foreground">Gestion des matchs de l'équipe E2D</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Matchs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{matchs?.length || 0}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Victoires</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{victoires}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Défaites</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{defaites}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Nuls</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-muted-foreground">{nuls}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Matchs</CardTitle>
        </CardHeader>
        <CardContent>
          <DataTable
            data={matchs || []}
            columns={[
              {
                key: "date_match",
                label: "Date",
                render: (item) =>
                  format(new Date(item.date_match), "dd MMM yyyy", { locale: fr }),
              },
              {
                key: "equipe_adverse",
                label: "Adversaire",
              },
              {
                key: "score",
                label: "Score",
                render: (item) => `${item.score_e2d} - ${item.score_adverse}`,
              },
              {
                key: "type_match",
                label: "Type",
                render: (item) => <Badge variant="outline">{item.type_match}</Badge>,
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
            emptyMessage="Aucun match enregistré"
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default E2DMatchsAdmin;
