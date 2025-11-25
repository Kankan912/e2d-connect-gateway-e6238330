import { DollarSign, Plus, Edit, Trash2, CreditCard } from "lucide-react";
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import BackButton from "@/components/BackButton";
import PretForm from "@/components/forms/PretForm";
import PretsPaiementsManager from "@/components/PretsPaiementsManager";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function PretsAdmin() {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedPret, setSelectedPret] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pretToDelete, setPretToDelete] = useState<string | null>(null);
  const [paiementsDialogOpen, setPaiementsDialogOpen] = useState(false);
  const [pretForPaiements, setPretForPaiements] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const { data: prets, isLoading } = useQuery({
    queryKey: ["prets"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prets")
        .select("*, emprunteur:membres!emprunteur_id(nom, prenom)")
        .order("date_pret", { ascending: false});
      if (error) throw error;
      return data as any[];
    },
  });

  const createPret = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from('prets').insert(data);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Prêt créé avec succès" });
      queryClient.invalidateQueries({ queryKey: ['prets'] });
      setFormOpen(false);
    },
    onError: () => {
      toast({ title: "Erreur lors de la création", variant: "destructive" });
    }
  });

  const updatePret = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const { error } = await supabase.from('prets').update(data).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Prêt modifié avec succès" });
      queryClient.invalidateQueries({ queryKey: ['prets'] });
      setFormOpen(false);
      setSelectedPret(null);
    }
  });

  const deletePret = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('prets').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Prêt supprimé" });
      queryClient.invalidateQueries({ queryKey: ['prets'] });
      setDeleteDialogOpen(false);
      setPretToDelete(null);
    }
  });

  const handleSubmit = (data: any) => {
    if (selectedPret) {
      updatePret.mutate({ id: selectedPret.id, data });
    } else {
      createPret.mutate(data);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BackButton />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <DollarSign className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Gestion des Prêts</h1>
        </div>
        <Button onClick={() => { setSelectedPret(null); setFormOpen(true); }}>
          <Plus className="h-4 w-4 mr-2" />
          Nouveau Prêt
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Prêts Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {prets?.filter((p) => p.statut === "en_cours").length || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Montant Total Prêté</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {prets
                ?.filter((p) => p.statut === "en_cours")
                .reduce((sum, p) => sum + p.montant, 0)
                .toFixed(2) || 0}{" "}
              €
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Prêts Remboursés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">
              {prets?.filter((p) => p.statut === "rembourse").length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Liste des Prêts</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Chargement...</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Emprunteur</TableHead>
                  <TableHead>Montant</TableHead>
                  <TableHead>Taux (%)</TableHead>
                  <TableHead>Échéance</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead>Reste à payer</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {prets?.map((pret) => (
                  <TableRow key={pret.id}>
                    <TableCell>{new Date(pret.date_pret).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {pret.emprunteur?.nom} {pret.emprunteur?.prenom}
                    </TableCell>
                    <TableCell>{pret.montant} €</TableCell>
                    <TableCell>{pret.taux_interet}%</TableCell>
                    <TableCell>{new Date(pret.echeance).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          pret.statut === "rembourse"
                            ? "default"
                            : pret.statut === "en_cours"
                            ? "secondary"
                            : "destructive"
                        }
                      >
                        {pret.statut}
                      </Badge>
                    </TableCell>
                    <TableCell>{(pret.montant - pret.montant_paye).toFixed(2)} €</TableCell>
                    <TableCell className="text-right">
                      <div className="flex gap-2 justify-end">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setPretForPaiements(pret.id);
                            setPaiementsDialogOpen(true);
                          }}
                        >
                          <CreditCard className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => { setSelectedPret(pret); setFormOpen(true); }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => { setPretToDelete(pret.id); setDeleteDialogOpen(true); }}
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

      <PretForm
        open={formOpen}
        onClose={() => { setFormOpen(false); setSelectedPret(null); }}
        onSubmit={handleSubmit}
        initialData={selectedPret}
      />

      {pretForPaiements && (
        <PretsPaiementsManager
          pretId={pretForPaiements}
          open={paiementsDialogOpen}
          onClose={() => {
            setPaiementsDialogOpen(false);
            setPretForPaiements(null);
          }}
        />
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer ce prêt ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => pretToDelete && deletePret.mutate(pretToDelete)}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
