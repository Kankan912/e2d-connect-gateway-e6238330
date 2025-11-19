import { Download, Plus } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/BackButton";

export default function ExportsAdmin() {
  const { data: exports, isLoading } = useQuery({
    queryKey: ["exports-programmes"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exports_programmes")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Download className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Exports Programmés</h1>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nouvel Export
        </Button>
      </div>

      <p className="text-muted-foreground">
        Configurez des exports automatiques de vos données (membres, finances, matchs, etc.)
      </p>

      <Card>
        <CardHeader>
          <CardTitle>Exports Configurés</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Chargement...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Format</TableHead>
                  <TableHead>Fréquence</TableHead>
                  <TableHead>Dernier Export</TableHead>
                  <TableHead>Prochain Export</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {exports?.map((exp) => (
                  <TableRow key={exp.id}>
                    <TableCell className="font-medium">{exp.nom}</TableCell>
                    <TableCell>{exp.type}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{exp.format.toUpperCase()}</Badge>
                    </TableCell>
                    <TableCell>{exp.frequence}</TableCell>
                    <TableCell>
                      {exp.dernier_export
                        ? new Date(exp.dernier_export).toLocaleDateString()
                        : "Jamais"}
                    </TableCell>
                    <TableCell>
                      {exp.prochain_export
                        ? new Date(exp.prochain_export).toLocaleDateString()
                        : "-"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={exp.actif ? "default" : "secondary"}>
                        {exp.actif ? "Actif" : "Inactif"}
                      </Badge>
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
}
