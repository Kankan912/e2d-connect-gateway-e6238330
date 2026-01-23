import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Calendar, Users, GripVertical, Plus, Trash2, Download, Send, Lock, Loader2 } from "lucide-react";
import { useCalendrierBeneficiaires } from "@/hooks/useCalendrierBeneficiaires";
import { useCotisationsMensuellesExercice } from "@/hooks/useCotisationsMensuelles";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { formatFCFA } from "@/lib/utils";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { addE2DLogo, addE2DFooter } from "@/lib/pdf-utils";

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

export default function CalendrierBeneficiairesManager() {
  const [selectedExercice, setSelectedExercice] = useState<string>("");
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedMembre, setSelectedMembre] = useState<string>("");
  const [selectedMois, setSelectedMois] = useState<string>("");
  const [sending, setSending] = useState(false);
  const { userRole } = useAuth();
  const { toast } = useToast();

  const isAdmin = userRole && ['admin', 'administrateur', 'tresorier', 'super_admin', 'secretaire_general'].includes(userRole.toLowerCase());

  // Charger les exercices
  const { data: exercices = [] } = useQuery({
    queryKey: ['exercices-calendrier'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercices')
        .select('*')
        .order('date_debut', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  // Sélectionner l'exercice actif par défaut
  useEffect(() => {
    if (exercices.length > 0 && !selectedExercice) {
      const actif = exercices.find(e => e.statut === 'actif');
      setSelectedExercice(actif?.id || exercices[0].id);
    }
  }, [exercices, selectedExercice]);

  const selectedExerciceData = exercices.find(e => e.id === selectedExercice);
  const isLocked = selectedExerciceData?.statut === 'cloture';

  // Récupérer le calendrier
  const { 
    calendrier, 
    isLoading, 
    createBeneficiaire, 
    updateBeneficiaire, 
    deleteBeneficiaire,
    initializeCalendrier,
    calculerMontant
  } = useCalendrierBeneficiaires(selectedExercice);

  // Récupérer les cotisations mensuelles
  const { data: cotisationsMensuelles = [] } = useCotisationsMensuellesExercice(selectedExercice);

  // Membres E2D actifs
  const { data: membresE2D = [] } = useQuery({
    queryKey: ['membres-e2d-calendrier'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membres')
        .select('id, nom, prenom')
        .eq('statut', 'actif')
        .eq('est_membre_e2d', true)
        .order('nom');
      if (error) throw error;
      return data;
    }
  });

  // Membres non encore dans le calendrier
  const membresDisponibles = membresE2D.filter(
    m => !calendrier.some(c => c.membre_id === m.id)
  );

  // Initialiser le calendrier pour tous les membres
  const handleInitialize = async () => {
    if (!selectedExercice || calendrier.length > 0) return;
    
    const membresData = membresE2D.map(m => {
      const cotisation = cotisationsMensuelles.find(c => c.membre_id === m.id);
      return {
        id: m.id,
        montant_mensuel: cotisation?.montant || 20000
      };
    });

    initializeCalendrier.mutate({
      exerciceId: selectedExercice,
      membres: membresData
    });
  };

  // Ajouter un bénéficiaire (supporte multi-bénéficiaires par mois)
  const handleAdd = async () => {
    if (!selectedMembre || !selectedExercice || !selectedMois) return;
    
    const cotisation = cotisationsMensuelles.find(c => c.membre_id === selectedMembre);
    const nextRang = calendrier.length + 1;
    const moisNum = parseInt(selectedMois);
    
    // Calculer l'ordre dans le mois (pour multi-bénéficiaires)
    const beneficiairesDuMois = calendrier.filter(c => c.mois_benefice === moisNum);
    const ordreMois = beneficiairesDuMois.length + 1;
    
    await createBeneficiaire.mutateAsync({
      exercice_id: selectedExercice,
      membre_id: selectedMembre,
      rang: nextRang,
      mois_benefice: moisNum > 0 ? moisNum : null,
      montant_mensuel: cotisation?.montant || 20000
    });
    
    setShowAddDialog(false);
    setSelectedMembre("");
    setSelectedMois("");
  };

  // Exporter en PDF
  const handleExportPDF = async () => {
    if (!calendrier.length || !selectedExerciceData) return;

    const doc = new jsPDF();
    
    // Ajouter le logo E2D en haut à droite
    await addE2DLogo(doc);
    
    // En-tête
    doc.setFontSize(18);
    doc.setTextColor(30, 64, 175);
    doc.text("Calendrier des Bénéficiaires", 14, 20);
    
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Exercice: ${selectedExerciceData.nom}`, 14, 28);
    
    doc.setFontSize(10);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 35);

    // Ligne de séparation
    doc.setDrawColor(30, 64, 175);
    doc.setLineWidth(0.5);
    doc.line(14, 40, doc.internal.pageSize.getWidth() - 14, 40);

    // Tableau
    const tableData = calendrier.map(b => [
      b.rang.toString(),
      `${b.membres?.prenom || ''} ${b.membres?.nom || ''}`,
      b.mois_benefice ? MOIS[b.mois_benefice - 1] : '-',
      formatFCFA(b.montant_mensuel),
      formatFCFA(b.montant_total)
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['Rang', 'Membre', 'Mois', 'Montant Mensuel', 'Montant Total (×12)']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [30, 64, 175] },
      styles: { fontSize: 10 }
    });

    // Total
    const totalAnnuel = calendrier.reduce((sum, b) => sum + Number(b.montant_total), 0);
    const finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Annuel: ${formatFCFA(totalAnnuel)}`, 14, finalY);

    // Pied de page E2D
    addE2DFooter(doc);

    doc.save(`calendrier-beneficiaires-${selectedExerciceData.nom}.pdf`);
    toast({ title: "PDF exporté avec succès" });
  };

  // Envoyer par email
  const handleSendNotification = async () => {
    if (!calendrier.length) return;
    setSending(true);

    try {
      const { data, error } = await supabase.functions.invoke('send-calendrier-beneficiaires', {
        body: {
          exerciceId: selectedExercice,
          exerciceNom: selectedExerciceData?.nom,
          calendrier: calendrier.map(b => ({
            rang: b.rang,
            nom: `${b.membres?.prenom} ${b.membres?.nom}`,
            mois: b.mois_benefice ? MOIS[b.mois_benefice - 1] : '-',
            montantMensuel: b.montant_mensuel,
            montantTotal: b.montant_total
          }))
        }
      });

      if (error) throw error;
      
      toast({ 
        title: "Notification envoyée",
        description: `${data?.emailsSent || 0} email(s) envoyé(s) aux membres`
      });
    } catch (error: any) {
      toast({
        title: "Erreur d'envoi",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setSending(false);
    }
  };

  // Mise à jour du montant mensuel
  const handleMontantChange = async (id: string, montant: number) => {
    if (isLocked && !isAdmin) return;
    await updateBeneficiaire.mutateAsync({ id, data: { montant_mensuel: montant } });
  };

  return (
    <div className="space-y-6">
      {/* En-tête avec sélecteur d'exercice */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Calendrier des Bénéficiaires
              </CardTitle>
              <CardDescription>
                Définir l'ordre annuel des bénéficiaires avec leur rang et montant
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select value={selectedExercice} onValueChange={setSelectedExercice}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Sélectionner un exercice" />
                </SelectTrigger>
                <SelectContent>
                  {exercices.map(e => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nom} {e.statut === 'actif' && <Badge variant="default" className="ml-2">Actif</Badge>}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {/* Actions */}
          <div className="flex flex-wrap gap-2 mb-4">
            {calendrier.length === 0 && !isLocked && (
              <Button
                onClick={handleInitialize}
                disabled={initializeCalendrier.isPending}
                className="bg-gradient-to-r from-primary to-secondary"
              >
                {initializeCalendrier.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Users className="w-4 h-4 mr-2" />}
                Initialiser avec tous les membres E2D
              </Button>
            )}
            
            {!isLocked && calendrier.length > 0 && (
              <Button variant="outline" onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un bénéficiaire
              </Button>
            )}

            {calendrier.length > 0 && (
              <>
                <Button variant="outline" onClick={handleExportPDF}>
                  <Download className="w-4 h-4 mr-2" />
                  Exporter PDF
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleSendNotification}
                  disabled={sending}
                >
                  {sending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                  Notifier les membres
                </Button>
              </>
            )}

            {isLocked && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Lock className="w-3 h-3" />
                Exercice clôturé (lecture seule)
              </Badge>
            )}
          </div>

          {/* Tableau du calendrier */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          ) : calendrier.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Aucun calendrier configuré pour cet exercice</p>
              <p className="text-sm mt-2">Cliquez sur "Initialiser" pour créer le calendrier</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Rang</TableHead>
                  <TableHead>Membre</TableHead>
                  <TableHead>Mois</TableHead>
                  <TableHead>Montant Mensuel</TableHead>
                  <TableHead>Montant Total (×12)</TableHead>
                  {!isLocked && isAdmin && <TableHead className="w-16">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {calendrier.map((b, index) => (
                  <TableRow key={b.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {!isLocked && <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab" />}
                        <Badge variant="outline">{b.rang}</Badge>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {b.membres?.prenom} {b.membres?.nom}
                    </TableCell>
                    <TableCell>
                      {b.mois_benefice ? (
                        <Badge>{MOIS[b.mois_benefice - 1]}</Badge>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {!isLocked && isAdmin ? (
                        <Input
                          type="number"
                          value={b.montant_mensuel}
                          onChange={(e) => handleMontantChange(b.id, parseFloat(e.target.value) || 0)}
                          className="w-32"
                        />
                      ) : (
                        formatFCFA(b.montant_mensuel)
                      )}
                    </TableCell>
                    <TableCell className="font-semibold">
                      {formatFCFA(b.montant_total)}
                    </TableCell>
                    {!isLocked && isAdmin && (
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => deleteBeneficiaire.mutate(b.id)}
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Total */}
          {calendrier.length > 0 && (
            <div className="mt-4 p-4 bg-muted/50 rounded-lg flex justify-between items-center">
              <span className="font-semibold">Total Annuel Prévu:</span>
              <span className="text-xl font-bold text-primary">
                {formatFCFA(calendrier.reduce((sum, b) => sum + Number(b.montant_total), 0))}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog d'ajout avec sélection du mois */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un bénéficiaire</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Membre</Label>
              <Select value={selectedMembre} onValueChange={setSelectedMembre}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un membre" />
                </SelectTrigger>
                <SelectContent>
                  {membresDisponibles.map(m => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.prenom} {m.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mois de bénéfice</Label>
              <Select value={selectedMois} onValueChange={setSelectedMois}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un mois" />
                </SelectTrigger>
                <SelectContent>
                  {MOIS.map((mois, index) => {
                    const beneficiairesDuMois = calendrier.filter(c => c.mois_benefice === index + 1);
                    return (
                      <SelectItem key={index + 1} value={String(index + 1)}>
                        {mois} {beneficiairesDuMois.length > 0 && `(${beneficiairesDuMois.length} bénéficiaire(s))`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground mt-1">
                Vous pouvez assigner plusieurs bénéficiaires au même mois
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Annuler</Button>
            <Button onClick={handleAdd} disabled={!selectedMembre || !selectedMois}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
