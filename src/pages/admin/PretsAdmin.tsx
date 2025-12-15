import { DollarSign, Plus, Edit, Trash2, CreditCard, FileText, RefreshCw, Search, LayoutDashboard, CheckCircle, AlertTriangle, Clock, Banknote, Eye, Settings } from "lucide-react";
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
import ReconduireModal from "@/components/ReconduireModal";
import PretDetailsModal from "@/components/PretDetailsModal";
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
import { addMonths, format } from "date-fns";

type StatutFilter = 'tous' | 'en_cours' | 'rembourse' | 'partiel' | 'en_retard' | 'reconduit';

export default function PretsAdmin() {
  const [formOpen, setFormOpen] = useState(false);
  const [selectedPret, setSelectedPret] = useState<any>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [pretToDelete, setPretToDelete] = useState<string | null>(null);
  const [paiementsDialogOpen, setPaiementsDialogOpen] = useState(false);
  const [pretForPaiements, setPretForPaiements] = useState<string | null>(null);
  const [reconduireDialogOpen, setReconduireDialogOpen] = useState(false);
  const [pretForReconduction, setPretForReconduction] = useState<any>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [pretForDetails, setPretForDetails] = useState<string | null>(null);
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

  // Configuration des prêts (max reconductions, etc.)
  const { data: pretsConfig } = useQuery({
    queryKey: ["prets-config"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prets_config")
        .select("*")
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const maxReconductions = pretsConfig?.max_reconductions || 3;
  const dureeReconduction = pretsConfig?.duree_reconduction || 2;

  // Calculer le total dû actuel (utilise montant_total_du si disponible, sinon calcule)
  const calculerTotalDu = (pret: any): number => {
    if (pret.montant_total_du && pret.montant_total_du > 0) {
      return parseFloat(pret.montant_total_du.toString());
    }
    // Sinon calculer: capital + intérêt initial (5%)
    const taux = pret.taux_interet || 5;
    const capital = parseFloat(pret.montant.toString());
    const interet = capital * (taux / 100);
    return capital + interet;
  };

  // Calculer le solde restant (total dû - montant payé)
  const calculerSoldeRestant = (pret: any): number => {
    const totalDu = calculerTotalDu(pret);
    const paye = pret.montant_paye || 0;
    return Math.max(0, totalDu - paye);
  };

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

  // Payer Total
  const payerTotal = useMutation({
    mutationFn: async (pret: any) => {
      const soldeRestant = calculerSoldeRestant(pret);
      const totalDu = calculerTotalDu(pret);
      const interetTotal = pret.interet_initial || (pret.montant * (pret.taux_interet || 5) / 100);
      
      const { error: paiementError } = await supabase.from('prets_paiements').insert([{
        pret_id: pret.id,
        montant_paye: soldeRestant,
        date_paiement: new Date().toISOString().split('T')[0],
        notes: 'Paiement total du solde restant',
        type_paiement: 'mixte',
        mode_paiement: 'especes'
      }]);
      if (paiementError) throw paiementError;

      const { error: pretError } = await supabase.from('prets').update({
        montant_paye: totalDu,
        capital_paye: pret.montant,
        interet_paye: interetTotal,
        montant_total_du: 0,
        dernier_interet: 0,
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

  // Vérifier si on peut reconduire (intérêt actuel doit être payé)
  const peutReconduirePret = (pret: any): { peut: boolean; raison: string } => {
    if ((pret.reconductions || 0) >= maxReconductions) {
      return { peut: false, raison: `Limite de reconductions atteinte (${maxReconductions} max)` };
    }
    
    // L'intérêt actuel doit être payé avant reconduction
    const interetActuel = pret.dernier_interet || pret.interet_initial || (pret.montant * (pret.taux_interet || 5) / 100);
    const interetPaye = pret.interet_paye || 0;
    
    if (interetPaye < interetActuel) {
      const reste = interetActuel - interetPaye;
      return { peut: false, raison: `Payez d'abord l'intérêt (${formatFCFA(reste)} restant)` };
    }
    
    return { peut: true, raison: '' };
  };

  // Reconduire: applique taux% sur le CAPITAL RESTANT (pas le solde total)
  const reconduire = useMutation({
    mutationFn: async (pret: any) => {
      const verification = peutReconduirePret(pret);
      if (!verification.peut) {
        throw new Error(verification.raison);
      }

      const taux = pret.taux_interet || 5;
      
      // RÈGLE MÉTIER: Reconduction sur le CAPITAL RESTANT uniquement
      const capitalRestant = pret.montant - (pret.capital_paye || 0);
      
      // Nouvel intérêt = Capital restant × Taux%
      const nouvelInteret = capitalRestant * (taux / 100);
      
      // Nouveau total dû = Capital restant + Nouvel intérêt
      const nouveauTotalDu = capitalRestant + nouvelInteret;

      const nouvelleEcheance = addMonths(new Date(pret.echeance), dureeReconduction);

      const { error } = await supabase.from('prets').update({
        echeance: format(nouvelleEcheance, 'yyyy-MM-dd'),
        montant_total_du: nouveauTotalDu,
        dernier_interet: nouvelInteret,
        interet_paye: 0, // Reset car nouvel intérêt
        reconductions: (pret.reconductions || 0) + 1
      }).eq('id', pret.id);
      if (error) throw error;

      const { error: reconError } = await supabase.from('prets_reconductions').insert({
        pret_id: pret.id,
        date_reconduction: new Date().toISOString().split('T')[0],
        interet_mois: nouvelInteret,
        notes: `Reconduction #${(pret.reconductions || 0) + 1} - Intérêt ${taux}% sur capital restant ${formatFCFA(capitalRestant)}`
      });
      if (reconError) throw reconError;
    },
    onSuccess: () => {
      toast({ title: "Prêt reconduit avec intérêt sur le capital restant" });
      queryClient.invalidateQueries({ queryKey: ['prets'] });
      queryClient.invalidateQueries({ queryKey: ['prets-reconductions'] });
      setReconduireDialogOpen(false);
      setPretForReconduction(null);
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

  // Statut effectif
  const getEffectiveStatus = (pret: any) => {
    const totalDu = calculerTotalDu(pret);
    const paye = pret.montant_paye || 0;
    const echeance = new Date(pret.echeance);
    const now = new Date();

    if (paye >= totalDu) return 'rembourse';
    if (paye > 0 && paye < totalDu) return 'partiel';
    if (echeance < now && pret.statut !== 'rembourse') return 'en_retard';
    if (pret.reconductions > 0) return 'reconduit';
    return pret.statut;
  };

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
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Filtrage et tri
  const filteredPrets = useMemo(() => {
    if (!prets) return [];
    
    const filtered = prets.filter(pret => {
      const searchLower = searchQuery.toLowerCase();
      const matchSearch = !searchQuery || 
        pret.emprunteur?.nom?.toLowerCase().includes(searchLower) ||
        pret.emprunteur?.prenom?.toLowerCase().includes(searchLower) ||
        pret.avaliste?.nom?.toLowerCase().includes(searchLower);

      const effectiveStatus = getEffectiveStatus(pret);
      const matchStatut = statutFilter === 'tous' || effectiveStatus === statutFilter;

      return matchSearch && matchStatut;
    });

    const priorityOrder: Record<string, number> = {
      'en_retard': 0,
      'en_cours': 1,
      'reconduit': 2,
      'partiel': 3,
      'rembourse': 4
    };

    return filtered.sort((a, b) => {
      const priorityA = priorityOrder[getEffectiveStatus(a)] ?? 5;
      const priorityB = priorityOrder[getEffectiveStatus(b)] ?? 5;
      return priorityA - priorityB;
    });
  }, [prets, searchQuery, statutFilter]);

  // Statistiques
  const pretsActifs = prets?.filter((p) => getEffectiveStatus(p) === "en_cours").length || 0;
  const pretsPartiels = prets?.filter((p) => getEffectiveStatus(p) === "partiel").length || 0;
  const pretsEnRetard = prets?.filter((p) => getEffectiveStatus(p) === "en_retard").length || 0;
  const totalReconductions = prets?.reduce((sum, p) => sum + (p.reconductions || 0), 0) || 0;
  const montantPrete = prets?.filter((p) => getEffectiveStatus(p) !== "rembourse").reduce((sum, p) => sum + p.montant, 0) || 0;
  const pretsRembourses = prets?.filter((p) => getEffectiveStatus(p) === "rembourse").length || 0;
  const montantRestant = prets?.filter((p) => getEffectiveStatus(p) !== "rembourse").reduce((sum, p) => sum + calculerTotalDu(p) - (p.montant_paye || 0), 0) || 0;
  const totalInterets = prets?.reduce((sum, p) => {
    // Somme des intérêts initiaux (générés à la création) - toujours positif
    const interet = p.interet_initial ?? (p.montant * (p.taux_interet || 5) / 100);
    return sum + Math.max(0, interet);
  }, 0) || 0;

  // Log pour vérification (à supprimer en production)
  console.log('📊 Stats prêts:', { 
    totalInterets, 
    montantPrete, 
    montantRestant,
    nbPrets: prets?.length,
    details: prets?.map(p => ({ 
      id: p.id.slice(0,8), 
      interet_initial: p.interet_initial, 
      calcul: p.montant * (p.taux_interet || 5) / 100,
      statut: p.statut 
    }))
  });

  const handleOpenReconduire = (pret: any) => {
    setPretForReconduction(pret);
    setReconduireDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <BackButton />
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-2">
          <DollarSign className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Gestion des Prêts</h1>
            <p className="text-sm text-muted-foreground">
              Reconduction: +{dureeReconduction} mois | Max: {maxReconductions} | Règle: Intérêt avant capital
            </p>
          </div>
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

      {/* Dashboard */}
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
            </CardContent>
          </Card>
        </div>
      )}

      {/* Stats */}
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
            <CardTitle className="text-sm text-muted-foreground">Total Reconductions</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-600">{totalReconductions}</p>
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
                  placeholder="Rechercher..."
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
                  <SelectItem value="tous">Tous</SelectItem>
                  <SelectItem value="en_cours">En cours</SelectItem>
                  <SelectItem value="partiel">Partiel</SelectItem>
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
                    <TableHead>Montant</TableHead>
                    <TableHead>Taux</TableHead>
                    <TableHead>Total dû</TableHead>
                    <TableHead>Échéance</TableHead>
                    <TableHead>Recon.</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Reste</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPrets?.map((pret) => {
                    // RESTE = montant_total_du directement (valeur stockée en base)
                    const estRembourse = getEffectiveStatus(pret) === 'rembourse';
                    const resteAPayer = estRembourse ? 0 : (pret.montant_total_du || calculerTotalDu(pret));
                    
                    // Vérification pour reconduction
                    const verifReconduction = peutReconduirePret(pret);
                    
                    return (
                      <TableRow key={pret.id} className={getRowClass(pret)}>
                        <TableCell>{new Date(pret.date_pret).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell className="font-medium">
                          {pret.emprunteur?.nom} {pret.emprunteur?.prenom}
                        </TableCell>
                        <TableCell>{formatFCFA(pret.montant)}</TableCell>
                        <TableCell>{pret.taux_interet}%</TableCell>
                        <TableCell className="font-medium">{formatFCFA(pret.montant_total_du || calculerTotalDu(pret))}</TableCell>
                        <TableCell>{new Date(pret.echeance).toLocaleDateString('fr-FR')}</TableCell>
                        <TableCell>
                          {pret.reconductions > 0 ? (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Badge 
                                    variant="outline" 
                                    className={`flex items-center gap-1 ${!verifReconduction.peut ? 'bg-red-100 text-red-800' : ''}`}
                                  >
                                    <RefreshCw className="h-3 w-3" />
                                    {pret.reconductions}/{maxReconductions}
                                  </Badge>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>{pret.reconductions}/{maxReconductions} reconductions</p>
                                  {!verifReconduction.peut && <p className="text-red-500">{verifReconduction.raison}</p>}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          ) : (
                            <span className="text-muted-foreground text-xs">0/{maxReconductions}</span>
                          )}
                        </TableCell>
                        <TableCell>{getStatutBadge(pret)}</TableCell>
                        <TableCell className={resteAPayer > 0 ? 'text-orange-600 font-medium' : 'text-green-600'}>
                          {formatFCFA(resteAPayer)}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex gap-0.5 justify-end flex-nowrap">
                            {/* Voir détails */}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-7 w-7"
                                    onClick={() => {
                                      setPretForDetails(pret.id);
                                      setDetailsDialogOpen(true);
                                    }}
                                  >
                                    <Eye className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Voir détails</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            {!estRembourse && (
                              <>
                                {/* Payer Total */}
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="default"
                                        className="h-7 w-7 bg-green-600 hover:bg-green-700"
                                        onClick={() => payerTotal.mutate(pret)}
                                        disabled={payerTotal.isPending}
                                      >
                                        <CheckCircle className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Payer Total ({formatFCFA(resteAPayer)})</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                {/* Paiement Partiel */}
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="outline"
                                        className="h-7 w-7"
                                        onClick={() => {
                                          setPretForPaiements(pret.id);
                                          setPaiementsDialogOpen(true);
                                        }}
                                      >
                                        <Banknote className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>Paiement Partiel</TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                                
                                {/* Reconduire */}
                                <TooltipProvider>
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button
                                        size="icon"
                                        variant="outline"
                                        className={`h-7 w-7 ${verifReconduction.peut ? 'border-blue-500 text-blue-600 hover:bg-blue-50' : 'opacity-50'}`}
                                        onClick={() => handleOpenReconduire(pret)}
                                        disabled={!verifReconduction.peut || reconduire.isPending}
                                      >
                                        <RefreshCw className="h-3.5 w-3.5" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                      {verifReconduction.peut 
                                        ? `Reconduire (+1 mois)` 
                                        : verifReconduction.raison
                                      }
                                    </TooltipContent>
                                  </Tooltip>
                                </TooltipProvider>
                              </>
                            )}
                            
                            {/* Gérer paiements */}
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button
                                    size="icon"
                                    variant="outline"
                                    className="h-7 w-7"
                                    onClick={() => {
                                      setPretForPaiements(pret.id);
                                      setPaiementsDialogOpen(true);
                                    }}
                                  >
                                    <CreditCard className="h-3.5 w-3.5" />
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>Gérer les paiements</TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                            
                            {/* Justificatif */}
                            {pret.justificatif_url && (
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <Button
                                      size="icon"
                                      variant="outline"
                                      className="h-7 w-7"
                                      onClick={() => window.open(pret.justificatif_url, '_blank')}
                                    >
                                      <FileText className="h-3.5 w-3.5" />
                                    </Button>
                                  </TooltipTrigger>
                                  <TooltipContent>Voir justificatif</TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            )}
                            
                            {/* Éditer */}
                            <Button
                              size="icon"
                              variant="outline"
                              className="h-7 w-7"
                              onClick={() => { setSelectedPret(pret); setFormOpen(true); }}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </Button>
                            
                            {/* Supprimer */}
                            <Button
                              size="icon"
                              variant="destructive"
                              className="h-7 w-7"
                              onClick={() => { setPretToDelete(pret.id); setDeleteDialogOpen(true); }}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                  {filteredPrets?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={10} className="text-center py-8 text-muted-foreground">
                        Aucun prêt trouvé
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Légende */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-200 dark:bg-green-900" />
              <span>Remboursé</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-orange-200 dark:bg-orange-900" />
              <span>Partiel</span>
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

      {/* Modals */}
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

      {pretForReconduction && (
        <ReconduireModal
          pret={pretForReconduction}
          maxReconductions={maxReconductions}
          dureeReconduction={dureeReconduction}
          soldeRestant={calculerSoldeRestant(pretForReconduction)}
          open={reconduireDialogOpen}
          onClose={() => {
            setReconduireDialogOpen(false);
            setPretForReconduction(null);
          }}
          onConfirm={() => reconduire.mutate(pretForReconduction)}
          isPending={reconduire.isPending}
        />
      )}

      {pretForDetails && (
        <PretDetailsModal
          pretId={pretForDetails}
          open={detailsDialogOpen}
          onClose={() => {
            setDetailsDialogOpen(false);
            setPretForDetails(null);
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
