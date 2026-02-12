import { Download, Plus, Edit, Trash2, Play } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import BackButton from "@/components/BackButton";
import ExportConfigForm from "@/components/forms/ExportConfigForm";
import { toast } from "@/hooks/use-toast";
import { ExportService } from "@/lib/exportService";

interface ExportsAdminProps {
  embedded?: boolean;
}

export default function ExportsAdmin({ embedded = false }: ExportsAdminProps) {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedExport, setSelectedExport] = useState<any>(null);
  const queryClient = useQueryClient();

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

  const createExport = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('exports_programmes').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Export créé avec succès" });
      queryClient.invalidateQueries({ queryKey: ['exports-programmes'] });
      setFormOpen(false);
    }
  });

  const updateExport = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from('exports_programmes').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Export modifié" });
      queryClient.invalidateQueries({ queryKey: ['exports-programmes'] });
      setFormOpen(false);
      setSelectedExport(null);
    }
  });

  const deleteExport = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('exports_programmes').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Export supprimé" });
      queryClient.invalidateQueries({ queryKey: ['exports-programmes'] });
    }
  });

  const executeExport = async (exp: any) => {
    try {
      toast({ title: "Export en cours...", description: "Génération du fichier" });
      
      await ExportService.export({
        type: exp.type,
        format: exp.format,
        nom: exp.nom,
        configuration: exp.configuration
      });

      // Mettre à jour la date du dernier export
      await supabase
        .from('exports_programmes')
        .update({ dernier_export: new Date().toISOString() })
        .eq('id', exp.id);

      queryClient.invalidateQueries({ queryKey: ['exports-programmes'] });
      toast({ title: "Export réussi", description: "Le fichier a été téléchargé" });
    } catch (error) {
      toast({ 
        title: "Erreur lors de l'export", 
        description: "Impossible de générer le fichier",
        variant: "destructive" 
      });
    }
  };

  const handleSubmit = (data: any) => {
    if (selectedExport) {
      updateExport.mutate({ id: selectedExport.id, data });
    } else {
      createExport.mutate(data);
    }
  };

  return (
    <div className={embedded ? "space-y-6" : "container mx-auto p-6 space-y-6"}>
      {!embedded && (
        <>
          <BackButton />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Download className="h-8 w-8 text-primary" />
              <h1 className="text-2xl sm:text-3xl font-bold">Exports Programmés</h1>
            </div>
            <Button onClick={() => { setSelectedExport(null); setFormOpen(true); }}>
              <Plus className="h-4 w-4 mr-2" />
              Nouvel Export
            </Button>
          </div>
          <p className="text-muted-foreground">
            Configurez des exports automatiques de vos données (membres, finances, matchs, etc.)
          </p>
        </>
      )}
      {embedded && (
        <div className="flex justify-end">
          <Button onClick={() => { setSelectedExport(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel Export
          </Button>
        </div>
      )}

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
                  <TableHead className="text-right">Actions</TableHead>
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
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => executeExport(exp)}
                        >
                          <Play className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setSelectedExport(exp); setFormOpen(true); }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteExport.mutate(exp.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ExportConfigForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setSelectedExport(null); }}
        onSubmit={handleSubmit}
        initialData={selectedExport}
      />
    </div>
  );
}
