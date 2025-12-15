import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Plus, Trash2, RefreshCw, Info, Calendar, AlertTriangle, Lock } from "lucide-react";
import { formatFCFA } from "@/lib/utils";
import { addMonths, format } from "date-fns";

interface PretsPaiementsManagerProps {
  pretId: string;
  open: boolean;
  onClose: () => void;
}

export default function PretsPaiementsManager({ pretId, open, onClose }: PretsPaiementsManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [montant, setMontant] = useState("");
  const [modePaiement, setModePaiement] = useState("especes");
  const [typePaiement, setTypePaiement] = useState<"interet" | "capital" | "mixte">("mixte");
  const [datePaiement, setDatePaiement] = useState(new Date().toISOString().split('T')[0]);

  const { data: pret } = useQuery({
    queryKey: ['pret', pretId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prets')
        .select('*, emprunteur:membres!membre_id(nom, prenom)')
        .eq('id', pretId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!pretId && open,
  });

  const { data: paiements } = useQuery({
    queryKey: ['prets-paiements', pretId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prets_paiements')
        .select('*')
        .eq('pret_id', pretId)
        .order('date_paiement', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!pretId && open,
  });

  const { data: reconductions } = useQuery({
    queryKey: ['prets-reconductions', pretId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prets_reconductions')
        .select('*')
        .eq('pret_id', pretId)
        .order('date_reconduction', { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!pretId && open,
  });

  // Calculs selon la règle métier:
  // - Intérêt initial = Capital × Taux%
  // - Total dû initial = Capital + Intérêt initial
  // - Après paiement partiel + reconduction: 
  //   Nouveau solde = Total dû - Paiement
  //   Nouvel intérêt = Nouveau solde × Taux%
  //   Nouveau total dû = Nouveau solde + Nouvel intérêt
  
  const calculerTotalDu = (pret: any): number => {
    if (!pret) return 0;
    // montant_total_du contient le montant actuellement dû après reconductions
    // Si non défini, calculer: capital + intérêt initial
    if (pret.montant_total_du && pret.montant_total_du > 0) {
      return parseFloat(pret.montant_total_du.toString());
    }
    const taux = pret.taux_interet || 5;
    const capital = parseFloat(pret.montant.toString());
    const interet = capital * (taux / 100);
    return capital + interet;
  };

  const totalPaye = paiements?.reduce((sum, p) => sum + parseFloat(p.montant_paye.toString()), 0) || 0;
  const totalDu = calculerTotalDu(pret);
  
  // Calculer l'intérêt dans le total dû actuel
  const capitalInitial = pret ? parseFloat(pret.montant.toString()) : 0;
  const capitalPaye = pret?.capital_paye || 0;
  const capitalRestant = Math.max(0, capitalInitial - capitalPaye);
  
  // L'intérêt inclus dans le total dû actuel
  const interetDansTotal = totalDu - capitalRestant;
  const interetPaye = pret?.interet_paye || 0;
  const interetRestant = Math.max(0, interetDansTotal - interetPaye);
  
  const montantRestant = Math.max(0, totalDu - totalPaye);
  const estRembourse = pret?.statut === 'rembourse' || montantRestant <= 0;

  // Règle: Peut payer le capital seulement si intérêt soldé
  const peutPayerCapital = interetRestant <= 0;

  // Reset type si on ne peut pas payer capital
  useEffect(() => {
    if (!peutPayerCapital && typePaiement === 'capital') {
      setTypePaiement('interet');
    }
  }, [peutPayerCapital, typePaiement]);

  const ajouterPaiement = useMutation({
    mutationFn: async () => {
      const montantPaye = parseFloat(montant);
      
      // Insérer le paiement
      const { error } = await supabase.from('prets_paiements').insert({
        pret_id: pretId,
        montant_paye: montantPaye,
        date_paiement: datePaiement,
        mode_paiement: modePaiement,
        type_paiement: typePaiement,
      });
      if (error) throw error;

      // Calculer les nouvelles valeurs selon le type de paiement
      let nouvelInteretPaye = interetPaye;
      let nouveauCapitalPaye = capitalPaye;
      
      if (typePaiement === 'interet') {
        nouvelInteretPaye = interetPaye + montantPaye;
      } else if (typePaiement === 'capital') {
        nouveauCapitalPaye = capitalPaye + montantPaye;
      } else {
        // Mixte: d'abord intérêt, puis capital
        const pourInteret = Math.min(montantPaye, interetRestant);
        const pourCapital = montantPaye - pourInteret;
        nouvelInteretPaye = interetPaye + pourInteret;
        nouveauCapitalPaye = capitalPaye + pourCapital;
      }

      const nouveauTotalPaye = totalPaye + montantPaye;
      
      // Calculer le nouveau solde restant
      const nouveauSolde = totalDu - montantPaye;
      
      const updates: any = { 
        montant_paye: nouveauTotalPaye,
        interet_paye: nouvelInteretPaye,
        capital_paye: nouveauCapitalPaye,
        montant_total_du: Math.max(0, nouveauSolde),
      };

      // Si remboursé complètement
      if (nouveauSolde <= 0) {
        updates.statut = 'rembourse';
        updates.montant_total_du = 0;
      }

      await supabase.from('prets').update(updates).eq('id', pretId);
    },
    onSuccess: () => {
      toast({ title: "Paiement ajouté avec succès" });
      queryClient.invalidateQueries({ queryKey: ['prets-paiements', pretId] });
      queryClient.invalidateQueries({ queryKey: ['pret', pretId] });
      queryClient.invalidateQueries({ queryKey: ['prets'] });
      setMontant("");
      setModePaiement("especes");
      setTypePaiement("mixte");
      setDatePaiement(new Date().toISOString().split('T')[0]);
    },
    onError: (error: any) => {
      toast({ title: "Erreur lors de l'ajout du paiement", description: error.message, variant: "destructive" });
    },
  });

  const supprimerPaiement = useMutation({
    mutationFn: async (paiementId: string) => {
      const paiement = paiements?.find(p => p.id === paiementId);
      if (!paiement) return;

      const { error } = await supabase.from('prets_paiements').delete().eq('id', paiementId);
      if (error) throw error;

      const nouveauTotalPaye = totalPaye - parseFloat(paiement.montant_paye.toString());
      await supabase
        .from('prets')
        .update({ montant_paye: nouveauTotalPaye, statut: 'en_cours' })
        .eq('id', pretId);
    },
    onSuccess: () => {
      toast({ title: "Paiement supprimé" });
      queryClient.invalidateQueries({ queryKey: ['prets-paiements', pretId] });
      queryClient.invalidateQueries({ queryKey: ['pret', pretId] });
      queryClient.invalidateQueries({ queryKey: ['prets'] });
    },
  });

  const rembourseSansHistorique = estRembourse && (!paiements || paiements.length === 0);

  // Progression correcte pour prêts remboursés
  const interetInitial = pret?.interet_initial || (capitalInitial * ((pret?.taux_interet || 5) / 100));
  
  // Pour un prêt remboursé, les valeurs payées sont complètes
  const interetPayeReel = estRembourse ? interetInitial : (pret?.interet_paye || 0);
  const capitalPayeReel = estRembourse ? capitalInitial : (pret?.capital_paye || 0);
  
  // Calcul des progressions
  const progressionInteret = interetInitial > 0 ? (interetPayeReel / interetInitial) * 100 : (estRembourse ? 100 : 0);
  const progressionCapital = capitalInitial > 0 ? (capitalPayeReel / capitalInitial) * 100 : (estRembourse ? 100 : 0);

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Gestion des paiements du prêt
            {estRembourse && (
              <Badge className="bg-green-500">Remboursé</Badge>
            )}
          </DialogTitle>
        </DialogHeader>

        {pret && (
          <div className="space-y-6">
            {/* Résumé du prêt */}
            <Card>
              <CardHeader>
                <CardTitle>Résumé</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Emprunteur</p>
                    <p className="font-medium">{(pret.emprunteur as any)?.nom} {(pret.emprunteur as any)?.prenom}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Capital emprunté</p>
                    <p className="font-medium">{formatFCFA(pret.montant)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Intérêts restants</p>
                    <p className="font-medium text-amber-600">{formatFCFA(interetRestant)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total dû</p>
                    <p className="font-bold">{formatFCFA(totalDu)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total payé</p>
                    <p className="font-medium text-green-600">
                      {rembourseSansHistorique ? formatFCFA(totalDu) : formatFCFA(totalPaye)}
                    </p>
                  </div>
                </div>
                
                {/* Barres de progression séparées */}
                <div className="space-y-4 mt-4 pt-4 border-t">
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-amber-500"></span>
                        Intérêts payés
                      </span>
                      <span>{formatFCFA(interetPayeReel)} / {formatFCFA(interetInitial)}</span>
                    </div>
                    <Progress value={progressionInteret} className="h-2 [&>div]:bg-amber-500" />
                    {!estRembourse && interetRestant > 0 && (
                      <p className="text-xs text-amber-600 mt-1">Reste: {formatFCFA(interetRestant)}</p>
                    )}
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="flex items-center gap-1">
                        <span className="w-3 h-3 rounded-full bg-blue-500"></span>
                        Capital remboursé
                      </span>
                      <span>{formatFCFA(capitalPayeReel)} / {formatFCFA(capitalInitial)}</span>
                    </div>
                    <Progress value={progressionCapital} className="h-2 [&>div]:bg-blue-500" />
                    {!estRembourse && capitalRestant > 0 && (
                      <p className="text-xs text-blue-600 mt-1">Reste: {formatFCFA(capitalRestant)}</p>
                    )}
                  </div>
                </div>

                {/* Reste à payer */}
                <div className="mt-4 p-3 bg-muted rounded-lg flex justify-between items-center">
                  <span className="font-medium">Reste à payer total</span>
                  <span className={`text-xl font-bold ${estRembourse ? 'text-green-600' : 'text-orange-600'}`}>
                    {estRembourse ? '0' : formatFCFA(montantRestant)}
                  </span>
                </div>

                {/* Info reconductions */}
                {(pret.reconductions || 0) > 0 && (
                  <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                    <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                      <RefreshCw className="h-4 w-4" />
                      <span className="font-medium">
                        {pret.reconductions} reconduction{pret.reconductions > 1 ? 's' : ''}
                      </span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Formulaire d'ajout - masqué si remboursé */}
            {!estRembourse && (
              <Card>
                <CardHeader>
                  <CardTitle>Ajouter un paiement</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Règle intérêt avant capital */}
                  {!peutPayerCapital && (
                    <Alert className="bg-amber-50 dark:bg-amber-950/30 border-amber-200">
                      <AlertTriangle className="h-4 w-4 text-amber-600" />
                      <AlertDescription className="text-amber-700 dark:text-amber-400">
                        <strong>Règle : Intérêt avant capital</strong><br />
                        Il reste {formatFCFA(interetRestant)} d'intérêts à payer avant de pouvoir rembourser le capital.
                      </AlertDescription>
                    </Alert>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div>
                      <Label>Montant</Label>
                      <Input
                        type="number"
                        value={montant}
                        onChange={(e) => setMontant(e.target.value)}
                        placeholder="Montant"
                      />
                    </div>
                    <div>
                      <Label>Type de paiement</Label>
                      <Select value={typePaiement} onValueChange={(v) => setTypePaiement(v as any)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="interet">
                            Intérêt ({formatFCFA(interetRestant)} restant)
                          </SelectItem>
                          <SelectItem value="capital" disabled={!peutPayerCapital}>
                            {peutPayerCapital 
                              ? `Capital (${formatFCFA(capitalRestant)} restant)`
                              : <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Capital (soldez l'intérêt)</span>
                            }
                          </SelectItem>
                          <SelectItem value="mixte">Mixte (auto-répartition)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={datePaiement}
                        onChange={(e) => setDatePaiement(e.target.value)}
                      />
                    </div>
                    <div>
                      <Label>Mode</Label>
                      <Select value={modePaiement} onValueChange={setModePaiement}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="especes">Espèces</SelectItem>
                          <SelectItem value="virement">Virement</SelectItem>
                          <SelectItem value="mobile">Mobile Money</SelectItem>
                          <SelectItem value="cheque">Chèque</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-end">
                      <Button
                        onClick={() => ajouterPaiement.mutate()}
                        disabled={!montant || ajouterPaiement.isPending}
                        className="w-full"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Ajouter
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Historique des reconductions */}
            {reconductions && reconductions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Historique des reconductions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Intérêt du mois</TableHead>
                        <TableHead>Notes</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {reconductions.map((recon: any) => (
                        <TableRow key={recon.id}>
                          <TableCell>
                            {new Date(recon.date_reconduction).toLocaleDateString('fr-FR')}
                          </TableCell>
                          <TableCell className="font-medium text-amber-600">
                            +{formatFCFA(recon.interet_mois)}
                          </TableCell>
                          <TableCell>{recon.notes || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}

            {/* Historique des paiements */}
            <Card>
              <CardHeader>
                <CardTitle>Historique des paiements</CardTitle>
              </CardHeader>
              <CardContent>
                {rembourseSansHistorique ? (
                  <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <Info className="h-5 w-5 text-blue-500" />
                    <div>
                      <p className="text-sm text-blue-700 dark:text-blue-400">
                        Ce prêt a été marqué comme remboursé avant la mise en place du suivi des paiements.
                      </p>
                      <p className="text-sm text-blue-600 dark:text-blue-500 mt-1">
                        Montant total remboursé: <strong>{formatFCFA(totalDu)}</strong>
                      </p>
                    </div>
                  </div>
                ) : paiements && paiements.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Mode</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paiements.map((paiement) => (
                        <TableRow key={paiement.id}>
                          <TableCell>
                            {new Date(paiement.date_paiement).toLocaleDateString('fr-FR')}
                          </TableCell>
                          <TableCell className="font-medium text-green-600">
                            {formatFCFA(paiement.montant_paye)}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="capitalize">
                              {paiement.type_paiement || 'mixte'}
                            </Badge>
                          </TableCell>
                          <TableCell className="capitalize">{paiement.mode_paiement}</TableCell>
                          <TableCell>{paiement.notes || "-"}</TableCell>
                          <TableCell className="text-right">
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => supprimerPaiement.mutate(paiement.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground text-center py-8">
                    Aucun paiement enregistré
                  </p>
                )}
              </CardContent>
            </Card>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
