import { DollarSign, Plus, Edit, Trash2, CreditCard, FileText, RefreshCw } from "lucide-react";
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

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
        .select(`
          *,
          emprunteur:membres!membre_id(id, nom, prenom),
          avaliste:membres!avaliste_id(id, nom, prenom),
          reunion:reunions!reunion_id(id, date_reunion, ordre_du_jour),
          exercice:exercices!exercice_id(id, nom)
        `)
        .order("date_pret", { ascending: false });
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
    onError: (error: any) => {
      toast({ title: "Erreur lors de la création", description: error.message, variant: "destructive" });
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

  const getStatutBadge = (statut: string) => {
    switch (statut) {
      case 'en_cours':
        return <Badge variant="secondary">En cours</Badge>;
      case 'rembourse':
        return <Badge className="bg-success text-success-foreground">Remboursé</Badge>;
      case 'en_retard':
        return <Badge variant="destructive">En retard</Badge>;
      case 'defaut':
        return <Badge variant="destructive">Défaut</Badge>;
      default:
        return <Badge variant="outline">{statut}</Badge>;
    }
  };

  // Statistiques
  const pretsActifs = prets?.filter((p) => p.statut === "en_cours").length || 0;
  const montantPrete = prets?.filter((p) => p.statut === "en_cours").reduce((sum, p) => sum + p.montant, 0) || 0;
  const pretsRembourses = prets?.filter((p) => p.statut === "rembourse").length || 0;
  const montantRestant = prets?.filter((p) => p.statut === "en_cours").reduce((sum, p) => sum + (p.montant_total_du || p.montant) - (p.montant_paye || 0), 0) || 0;

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

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Prêts Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{pretsActifs}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Montant Total Prêté</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold">{montantPrete.toLocaleString()} FCFA</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Reste à Rembourser</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-warning">{montantRestant.toLocaleString()} FCFA</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Prêts Remboursés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-success">{pretsRembourses}</p>
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
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Emprunteur</TableHead>
                    <TableHead>Avaliste</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Total dû</TableHead>
                    <TableHead>Taux</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead>Reconductions</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Reste à payer</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prets?.map((pret) => (
                    <TableRow key={pret.id}>
                      <TableCell>{new Date(pret.date_pret).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell className="font-medium">
                        {pret.emprunteur?.nom} {pret.emprunteur?.prenom}
                      </TableCell>
                      <TableCell>
                        {pret.avaliste ? (
                          <span className="text-sm">
                            {pret.avaliste.nom} {pret.avaliste.prenom}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell>{pret.montant.toLocaleString()} FCFA</TableCell>
                      <TableCell>
                        {(pret.montant_total_du || pret.montant).toLocaleString()} FCFA
                      </TableCell>
                      <TableCell>{pret.taux_interet}%</TableCell>
                      <TableCell>{new Date(pret.echeance).toLocaleDateString('fr-FR')}</TableCell>
                      <TableCell>
                        {pret.reconductions > 0 ? (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <RefreshCw className="h-3 w-3" />
                                  {pret.reconductions}
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>{pret.reconductions} reconduction(s)</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatutBadge(pret.statut)}</TableCell>
                      <TableCell>
                        {((pret.montant_total_du || pret.montant) - (pret.montant_paye || 0)).toLocaleString()} FCFA
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-1 justify-end">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
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
                              </TooltipTrigger>
                              <TooltipContent>Gérer les paiements</TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          {pret.justificatif_url && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => window.open(pret.justificatif_url, '_blank')}
                                  >
                                    <FileText className="h-4 w-4" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Voir le justificatif</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
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
                  {prets?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                        Aucun prêt enregistré
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
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
