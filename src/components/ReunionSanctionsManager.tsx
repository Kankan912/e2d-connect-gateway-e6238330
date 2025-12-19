import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ReunionSanctionsManagerProps {
  reunionId: string;
}

export default function ReunionSanctionsManager({ reunionId }: ReunionSanctionsManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [membreId, setMembreId] = useState("");
  const [typeSanction, setTypeSanction] = useState<string>("avertissement");
  const [motif, setMotif] = useState("");
  const [montantAmende, setMontantAmende] = useState("");

  // Charger les membres E2D actifs
  const { data: membres } = useQuery({
    queryKey: ['membres-e2d-sanctions'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membres')
        .select('id, nom, prenom')
        .eq('statut', 'actif')
        .eq('est_membre_e2d', true)
        .order('nom');
      if (error) throw error;
      return data;
    },
  });

  // Charger les sanctions de la réunion
  const { data: sanctions } = useQuery({
    queryKey: ['reunion-sanctions', reunionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reunions_sanctions')
        .select(`
          *,
          membre:membre_id(nom, prenom)
        `)
        .eq('reunion_id', reunionId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!reunionId,
  });

  // Ajouter une sanction
  const addSanction = useMutation({
    mutationFn: async (sanction: any) => {
      const { data, error } = await supabase
        .from('reunions_sanctions')
        .insert([sanction])
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reunion-sanctions', reunionId] });
      toast({
        title: "Sanction ajoutée",
        description: "La sanction a été enregistrée avec succès.",
      });
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Supprimer une sanction
  const deleteSanction = useMutation({
    mutationFn: async (sanctionId: string) => {
      const { error } = await supabase
        .from('reunions_sanctions')
        .delete()
        .eq('id', sanctionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reunion-sanctions', reunionId] });
      toast({
        title: "Sanction supprimée",
        description: "La sanction a été supprimée avec succès.",
      });
    },
  });

  const resetForm = () => {
    setMembreId("");
    setTypeSanction("avertissement");
    setMotif("");
    setMontantAmende("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!membreId || !motif) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    addSanction.mutate({
      reunion_id: reunionId,
      membre_id: membreId,
      type_sanction: typeSanction,
      motif,
      montant_amende: montantAmende ? parseFloat(montantAmende) : null,
      statut: 'active',
    });
  };

  const getSanctionBadgeVariant = (type: string) => {
    switch (type) {
      case 'avertissement':
        return 'secondary';
      case 'blame':
        return 'default';
      case 'amende':
        return 'destructive';
      case 'suspension':
        return 'destructive';
      default:
        return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Formulaire d'ajout */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Ajouter une Sanction
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Membre *</Label>
                <Select value={membreId} onValueChange={setMembreId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un membre" />
                  </SelectTrigger>
                  <SelectContent>
                    {membres?.map((membre) => (
                      <SelectItem key={membre.id} value={membre.id}>
                        {membre.prenom} {membre.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Type de Sanction *</Label>
                <Select value={typeSanction} onValueChange={setTypeSanction}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="avertissement">Avertissement</SelectItem>
                    <SelectItem value="blame">Blâme</SelectItem>
                    <SelectItem value="amende">Amende</SelectItem>
                    <SelectItem value="suspension">Suspension</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {typeSanction === 'amende' && (
              <div>
                <Label>Montant de l'amende (FCFA) *</Label>
                <Input
                  type="number"
                  value={montantAmende}
                  onChange={(e) => setMontantAmende(e.target.value)}
                  placeholder="Ex: 5000"
                  min="0"
                />
              </div>
            )}

            <div>
              <Label>Motif *</Label>
              <Textarea
                value={motif}
                onChange={(e) => setMotif(e.target.value)}
                placeholder="Décrire le motif de la sanction..."
                rows={3}
              />
            </div>

            <Button type="submit" disabled={addSanction.isPending}>
              <Plus className="w-4 h-4 mr-2" />
              {addSanction.isPending ? 'Ajout...' : 'Ajouter la Sanction'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Liste des sanctions */}
      <Card>
        <CardHeader>
          <CardTitle>Sanctions Enregistrées ({sanctions?.length || 0})</CardTitle>
        </CardHeader>
        <CardContent>
          {sanctions && sanctions.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Membre</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Motif</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sanctions.map((sanction: any) => (
                  <TableRow key={sanction.id}>
                    <TableCell>
                      {sanction.membre?.prenom} {sanction.membre?.nom}
                    </TableCell>
                    <TableCell>
                      <Badge variant={getSanctionBadgeVariant(sanction.type_sanction)}>
                        {sanction.type_sanction}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-xs truncate">
                      {sanction.motif}
                    </TableCell>
                    <TableCell>
                      {sanction.montant_amende 
                        ? `${parseFloat(sanction.montant_amende).toLocaleString()} FCFA`
                        : '-'
                      }
                    </TableCell>
                    <TableCell>
                      <Badge variant={sanction.statut === 'active' ? 'default' : 'secondary'}>
                        {sanction.statut}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => deleteSanction.mutate(sanction.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Aucune sanction enregistrée pour cette réunion
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
