import { useState } from "react";
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
import { Plus, Trash2 } from "lucide-react";

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
  const [datePaiement, setDatePaiement] = useState(new Date().toISOString().split('T')[0]);

  const { data: pret } = useQuery({
    queryKey: ['pret', pretId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('prets')
        .select('*, emprunteur:membres!emprunteur_id(nom, prenom)')
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

  const ajouterPaiement = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('prets_paiements').insert({
        pret_id: pretId,
        montant_paye: parseFloat(montant),
        date_paiement: datePaiement,
        mode_paiement: modePaiement,
      });
      if (error) throw error;

      // Mettre à jour le montant total payé du prêt
      const totalPaye = (paiements?.reduce((sum, p) => sum + parseFloat(p.montant_paye.toString()), 0) || 0) + parseFloat(montant);
      await supabase
        .from('prets')
        .update({ montant_paye: totalPaye })
        .eq('id', pretId);
    },
    onSuccess: () => {
      toast({ title: "Paiement ajouté avec succès" });
      queryClient.invalidateQueries({ queryKey: ['prets-paiements', pretId] });
      queryClient.invalidateQueries({ queryKey: ['pret', pretId] });
      queryClient.invalidateQueries({ queryKey: ['prets'] });
      setMontant("");
      setModePaiement("especes");
      setDatePaiement(new Date().toISOString().split('T')[0]);
    },
    onError: () => {
      toast({ title: "Erreur lors de l'ajout du paiement", variant: "destructive" });
    },
  });

  const supprimerPaiement = useMutation({
    mutationFn: async (paiementId: string) => {
      const paiement = paiements?.find(p => p.id === paiementId);
      if (!paiement) return;

      const { error } = await supabase.from('prets_paiements').delete().eq('id', paiementId);
      if (error) throw error;

      // Mettre à jour le montant total payé du prêt
      const totalPaye = (paiements?.reduce((sum, p) => sum + parseFloat(p.montant_paye.toString()), 0) || 0) - parseFloat(paiement.montant_paye.toString());
      await supabase
        .from('prets')
        .update({ montant_paye: totalPaye })
        .eq('id', pretId);
    },
    onSuccess: () => {
      toast({ title: "Paiement supprimé" });
      queryClient.invalidateQueries({ queryKey: ['prets-paiements', pretId] });
      queryClient.invalidateQueries({ queryKey: ['pret', pretId] });
      queryClient.invalidateQueries({ queryKey: ['prets'] });
    },
  });

  const totalPaye = paiements?.reduce((sum, p) => sum + parseFloat(p.montant_paye.toString()), 0) || 0;
  const montantRestant = pret ? parseFloat(pret.montant.toString()) - totalPaye : 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Gestion des paiements du prêt</DialogTitle>
        </DialogHeader>

        {pret && (
          <div className="space-y-6">
            {/* Résumé du prêt */}
            <Card>
              <CardHeader>
                <CardTitle>Résumé</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Emprunteur</p>
                    <p className="font-medium">{pret.emprunteur?.nom} {pret.emprunteur?.prenom}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Montant prêté</p>
                    <p className="font-medium">{parseFloat(pret.montant.toString()).toLocaleString()} FCFA</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total payé</p>
                    <p className="font-medium text-green-600">{totalPaye.toLocaleString()} FCFA</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Reste à payer</p>
                    <p className="font-medium text-orange-600">{montantRestant.toLocaleString()} FCFA</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Formulaire d'ajout */}
            <Card>
              <CardHeader>
                <CardTitle>Ajouter un paiement</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                    <Label>Date</Label>
                    <Input
                      type="date"
                      value={datePaiement}
                      onChange={(e) => setDatePaiement(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Mode de paiement</Label>
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

            {/* Historique des paiements */}
            <Card>
              <CardHeader>
                <CardTitle>Historique des paiements</CardTitle>
              </CardHeader>
              <CardContent>
                {paiements && paiements.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Montant</TableHead>
                        <TableHead>Mode</TableHead>
                        <TableHead>Notes</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {paiements.map((paiement) => (
                        <TableRow key={paiement.id}>
                          <TableCell>
                            {new Date(paiement.date_paiement).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="font-medium">
                            {parseFloat(paiement.montant_paye.toString()).toLocaleString()} FCFA
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
