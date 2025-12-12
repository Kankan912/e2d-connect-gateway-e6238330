import { DollarSign, Plus, Edit, Trash2, CreditCard, FileText, RefreshCw, Search, LayoutDashboard, CheckCircle, AlertTriangle, Clock, Banknote } from "lucide-react";
import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import BackButton from "@/components/BackButton";
import PretForm from "@/components/forms/PretForm";
import PretsPaiementsManager from "@/components/PretsPaiementsManager";
import { formatFCFA } from "@/lib/utils";
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

type StatutFilter = 'tous' | 'en_cours' | 'rembourse' | 'partiel' | 'en_retard' | 'reconduit';

export default function PretsAdmin() {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedPret, setSelectedPret] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pretToDelete, setPretToDelete] = useState<string | null>(null);
  const [paiementsDialogOpen, setPaiementsDialogOpen] = useState(false);
  const [pretForPaiements, setPretForPaiements] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statutFilter, setStatutFilter] = useState<StatutFilter>('tous');
  const [showDashboard, setShowDashboard] = useState(false);
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

  // Action: Payer Total
  const payerTotal = useMutation({
    mutationFn: async (pret: any) => {
      const resteAPayer = (pret.montant_total_du || pret.montant) - (pret.montant_paye || 0);
      
      // Ajouter un paiement
      const { error: paiementError } = await supabase.from('prets_paiements').insert([{
        pret_id: pret.id,
        montant_paye: resteAPayer,
        date_paiement: new Date().toISOString().split('T')[0],
        notes: 'Paiement total'
      }]);
      if (paiementError) throw paiementError;

      // Mettre à jour le prêt
      const { error: pretError } = await supabase.from('prets').update({
        montant_paye: pret.montant_total_du || pret.montant,
        statut: 'rembourse'
      }).eq('id', pret.id);
      if (pretError) throw pretError;
    },
    onSuccess: () => {
      toast({ title: "Prêt remboursé intégralement" });
      queryClient.invalidateQueries({ queryKey: ['prets'] });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  });

  // Action: Reconduire
  const reconduire = useMutation({
    mutationFn: async (pret: any) => {
      const nouvelleEcheance = new Date(pret.echeance);
      nouvelleEcheance.setMonth(nouvelleEcheance.getMonth() + 1);
      
      // Calculer les nouveaux intérêts
      const interetMensuel = (pret.montant * (pret.taux_interet / 100)) / 12;
      const nouveauTotal = (pret.montant_total_du || pret.montant) + interetMensuel;

      const { error } = await supabase.from('prets').update({
        echeance: nouvelleEcheance.toISOString().split('T')[0],
        montant_total_du: nouveauTotal,
        reconductions: (pret.reconductions || 0) + 1
      }).eq('id', pret.id);
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: "Prêt reconduit d'un mois avec nouveaux intérêts" });
      queryClient.invalidateQueries({ queryKey: ['prets'] });
    },
    onError: (error: any) => {
      toast({ title: "Erreur", description: error.message, variant: "destructive" });
    }
  });

  const handleSubmit = (data: any) => {
    if (selectedPret) {
      updatePret.mutate({ id: selectedPret.id, data });
    } else {
      createPret.mutate(data);
    }
  };

  // Calculer le statut effectif
  const getEffectiveStatus = (pret: any) => {
    const totalDu = pret.montant_total_du || pret.montant;
    const paye = pret.montant_paye || 0;
    const echeance = new Date(pret.echeance);
    const now = new Date();

    if (paye >= totalDu) return 'rembourse';
    if (paye > 0 && paye < totalDu) return 'partiel';
    if (echeance < now && pret.statut !== 'rembourse') return 'en_retard';
    if (pret.reconductions > 0) return 'reconduit';
    return pret.statut;
  };

  // Couleur de la ligne selon le statut
  const getRowClass = (pret: any) => {
    const status = getEffectiveStatus(pret);
    switch (status) {
      case 'rembourse':
        return 'bg-green-50 dark:bg-green-950/20 hover:bg-green-100 dark:hover:bg-green-950/30';
      case 'partiel':
        return 'bg-orange-50 dark:bg-orange-950/20 hover:bg-orange-100 dark:hover:bg-orange-950/30';
      case 'en_retard':
        return 'bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-950/30';
      case 'reconduit':
        return 'bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-950/30';
      default:
        return '';
    }
  };

  const getStatutBadge = (pret: any) => {
    const status = getEffectiveStatus(pret);
    switch (status) {
      case 'en_cours':
        return <Badge variant="secondary" className="bg-blue-100 text-blue-800"><Clock className="h-3 w-3 mr-1" />En cours</Badge>;
      case 'rembourse':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Remboursé</Badge>;
      case 'partiel':
        return <Badge className="bg-orange-500"><AlertTriangle className="h-3 w-3 mr-1" />Partiel</Badge>;
      case 'en_retard':
        return <Badge variant="destructive"><AlertTriangle className="h-3 w-3 mr-1" />En retard</Badge>;
      case 'reconduit':
        return <Badge className="bg-blue-500"><RefreshCw className="h-3 w-3 mr-1" />Reconduit</Badge>;
      case 'defaut':
        return <Badge variant="destructive">Défaut</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Filtrer les prêts
  const filteredPrets = useMemo(() => {
    if (!prets) return [];
    
    return prets.filter(pret => {
      // Filtre par recherche
      const searchLower = searchQuery.toLowerCase();
      const matchSearch = !searchQuery || 
        pret.emprunteur?.nom?.toLowerCase().includes(searchLower) ||
        pret.emprunteur?.prenom?.toLowerCase().includes(searchLower) ||
        pret.avaliste?.nom?.toLowerCase().includes(searchLower) ||
        pret.avaliste?.prenom?.toLowerCase().includes(searchLower);

      // Filtre par statut
      const effectiveStatus = getEffectiveStatus(pret);
      const matchStatut = statutFilter === 'tous' || effectiveStatus === statutFilter;

      return matchSearch && matchStatut;
    });
  }, [prets, searchQuery, statutFilter]);

  // Statistiques
  const pretsActifs = prets?.filter((p) => getEffectiveStatus(p) === "en_cours").length || 0;
  const pretsPartiels = prets?.filter((p) => getEffectiveStatus(p) === "partiel").length || 0;
  const pretsEnRetard = prets?.filter((p) => getEffectiveStatus(p) === "en_retard").length || 0;
  const pretsReconduits = prets?.filter((p) => getEffectiveStatus(p) === "reconduit").length || 0;
  const montantPrete = prets?.filter((p) => getEffectiveStatus(p) !== "rembourse").reduce((sum, p) => sum + p.montant, 0) || 0;
  const pretsRembourses = prets?.filter((p) => getEffectiveStatus(p) === "rembourse").length || 0;
  const montantRestant = prets?.filter((p) => getEffectiveStatus(p) !== "rembourse").reduce((sum, p) => sum + (p.montant_total_du || p.montant) - (p.montant_paye || 0), 0) || 0;
  const totalInterets = prets?.reduce((sum, p) => sum + ((p.montant_total_du || p.montant) - p.montant), 0) || 0;

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BackButton />
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-8 w-8 text-primary" />
          <h1 className="text-3xl font-bold">Gestion des Prêts</h1>
        </div>
        <div className="flex gap-2">
          <Button 
            variant={showDashboard ? "default" : "outline"} 
            onClick={() => setShowDashboard(!showDashboard)}
          >
            <LayoutDashboard className="h-4 w-4 mr-2" />
            Tableau de Bord
          </Button>
          <Button onClick={() => { setSelectedPret(null); setFormOpen(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Nouveau Prêt
          </Button>
        </div>
      </div>

      {/* Tableau de bord détaillé */}
      {showDashboard && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Prêts En Cours
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-blue-600">{pretsActifs}</p>
              <p className="text-xs text-muted-foreground mt-1">Prêts actifs</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-orange-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                Partiellement Payés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-orange-600">{pretsPartiels}</p>
              <p className="text-xs text-muted-foreground mt-1">Paiements en cours</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-red-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <AlertTriangle className="h-4 w-4" />
                En Retard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-red-600">{pretsEnRetard}</p>
              <p className="text-xs text-muted-foreground mt-1">Échéance dépassée</p>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Remboursés
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-green-600">{pretsRembourses}</p>
              <p className="text-xs text-muted-foreground mt-1">Prêts soldés</p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Statistiques principales */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Montant Total Prêté</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatFCFA(montantPrete)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Reste à Rembourser</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-orange-600">{formatFCFA(montantRestant)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Intérêts Générés</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-primary">{formatFCFA(totalInterets)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-muted-foreground">Reconductions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{pretsReconduits}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
            <CardTitle>Liste des Prêts ({filteredPrets.length})</CardTitle>
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher un emprunteur..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 w-full sm:w-64"
                />
              </div>
              <Select value={statutFilter} onValueChange={(v) => setStatutFilter(v as StatutFilter)}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrer par statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tous">Tous les statuts</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="partiel">Partiellement payé</SelectItem>
                  <SelectItem value="en_retard">En retard</SelectItem>
                  <SelectItem value="reconduit">Reconduit</SelectItem>
                  <SelectItem value="rembourse">Remboursé</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
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
                  {filteredPrets?.map((pret) => {
                    const resteAPayer = (pret.montant_total_du || pret.montant) - (pret.montant_paye || 0);
                    const estRembourse = getEffectiveStatus(pret) === 'rembourse';
                    
                    return (
                      <TableRow key={pret.id} className={getRowClass(pret)}>
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
                        <TableCell>{formatFCFA(pret.montant)}</TableCell>
                        <TableCell className="font-medium">
                          {formatFCFA(pret.montant_total_du || pret.montant)}
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
                        <TableCell>{getStatutBadge(pret)}</TableCell>
                        <TableCell className={resteAPayer > 0 ? 'text-orange-600 font-medium' : 'text-green-600'}>
                          {formatFCFA(resteAPayer)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-1 justify-end flex-wrap">
                            {/* Actions rapides */}
                            {!estRembourse && (
                              <>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="default"
                                        className="bg-green-600 hover:bg-green-700"
                                        onClick={() => payerTotal.mutate(pret)}
                                        disabled={payerTotal.isPending}
                                      >
                                        <CheckCircle className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Payer Total ({formatFCFA(resteAPayer)})</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
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
                                        <Banknote className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Paiement Partiel</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="border-blue-500 text-blue-600 hover:bg-blue-50"
                                        onClick={() => reconduire.mutate(pret)}
                                        disabled={reconduire.isPending}
                                      >
                                        <RefreshCw className="h-4 w-4" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Reconduire (+1 mois)</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </>
                            )}
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
                    );
                  })}
                  {filteredPrets?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={11} className="text-center py-8 text-muted-foreground">
                        {prets?.length === 0 ? 'Aucun prêt enregistré' : 'Aucun prêt ne correspond aux critères'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Légende des couleurs */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-200 dark:bg-green-900" />
              <span>Remboursé</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-200 dark:bg-orange-900" />
              <span>Partiellement payé</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-200 dark:bg-red-900" />
              <span>En retard</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-200 dark:bg-blue-900" />
              <span>Reconduit</span>
            </div>
          </div>
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
