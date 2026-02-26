import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Calendar, Users, Plus, Trash2, Download, Send, Lock, Loader2, X, Edit2 } from "lucide-react";
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
  const [showReorderDialog, setShowReorderDialog] = useState(false);
  const [pendingReorderUpdates, setPendingReorderUpdates] = useState<Array<{ id: string; rang: number }>>([]);
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [editingBeneficiaire, setEditingBeneficiaire] = useState<string | null>(null);
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

  const { 
    calendrier, 
    isLoading, 
    createBeneficiaire, 
    updateBeneficiaire, 
    deleteBeneficiaire,
    reorderBeneficiaires,
    initializeCalendrier,
    calculerMontant
  } = useCalendrierBeneficiaires(selectedExercice);

  const { data: cotisationsMensuelles = [] } = useCotisationsMensuellesExercice(selectedExercice);

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

  const membresDisponibles = membresE2D.filter(
    m => !calendrier.some(c => c.membre_id === m.id)
  );

  // Group beneficiaries by month
  const groupedByMonth = useMemo(() => {
    const groups = new Map<number | null, any[]>();
    // Initialize all 12 months
    for (let i = 1; i <= 12; i++) {
      groups.set(i, []);
    }
    groups.set(null, []);

    calendrier.forEach(b => {
      const key = b.mois_benefice ?? null;
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(b);
    });

    // Sort within each month by rang
    groups.forEach((list) => list.sort((a: any, b: any) => a.rang - b.rang));

    return groups;
  }, [calendrier]);

  // Build ordered month keys: 1..12, then null if has entries
  const monthKeys = useMemo(() => {
    const keys: (number | null)[] = [];
    for (let i = 1; i <= 12; i++) keys.push(i);
    if ((groupedByMonth.get(null) || []).length > 0) keys.push(null);
    return keys;
  }, [groupedByMonth]);

  const handleInitialize = async () => {
    if (!selectedExercice || calendrier.length > 0) return;
    const membresData = membresE2D.map(m => {
      const cotisation = cotisationsMensuelles.find(c => c.membre_id === m.id);
      return { id: m.id, montant_mensuel: cotisation?.montant || 20000 };
    });
    initializeCalendrier.mutate({ exerciceId: selectedExercice, membres: membresData });
  };

  const handleAdd = async () => {
    if (!selectedMembre || !selectedExercice || !selectedMois) return;
    const cotisation = cotisationsMensuelles.find(c => c.membre_id === selectedMembre);
    const nextRang = calendrier.length + 1;
    const moisNum = parseInt(selectedMois);

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

  // PDF export grouped by month
  const handleExportPDF = async () => {
    if (!calendrier.length || !selectedExerciceData) return;

    const doc = new jsPDF();
    await addE2DLogo(doc);

    doc.setFontSize(18);
    doc.setTextColor(30, 64, 175);
    doc.text("Calendrier des Bénéficiaires", 14, 20);
    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Exercice: ${selectedExerciceData.nom}`, 14, 28);
    doc.setFontSize(10);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, 14, 35);
    doc.setDrawColor(30, 64, 175);
    doc.setLineWidth(0.5);
    doc.line(14, 40, doc.internal.pageSize.getWidth() - 14, 40);

    const tableData: string[][] = [];
    monthKeys.forEach(moisKey => {
      const beneficiaires = groupedByMonth.get(moisKey) || [];
      if (beneficiaires.length === 0) return;
      const moisLabel = moisKey !== null ? MOIS[moisKey - 1] : "Non défini";
      const noms = beneficiaires.map((b: any) => `${b.membres?.prenom || ''} ${b.membres?.nom || ''}`).join("\n");
      const totalMensuel = beneficiaires.reduce((s: number, b: any) => s + Number(b.montant_mensuel), 0);
      const totalAnnuel = beneficiaires.reduce((s: number, b: any) => s + Number(b.montant_total), 0);
      tableData.push([
        moisLabel,
        noms,
        String(beneficiaires.length),
        formatFCFA(totalMensuel),
        formatFCFA(totalAnnuel)
      ]);
    });

    autoTable(doc, {
      startY: 45,
      head: [['Mois', 'Bénéficiaires', 'Nb', 'Montant Mensuel', 'Total (×12)']],
      body: tableData,
      theme: 'striped',
      headStyles: { fillColor: [30, 64, 175] },
      styles: { fontSize: 10, cellPadding: 4 },
      columnStyles: { 1: { cellWidth: 60 } }
    });

    const totalAnnuel = calendrier.reduce((sum, b) => sum + Number(b.montant_total), 0);
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text(`Total Annuel: ${formatFCFA(totalAnnuel)}`, 14, finalY);
    addE2DFooter(doc);
    doc.save(`calendrier-beneficiaires-${selectedExerciceData.nom}.pdf`);
    toast({ title: "PDF exporté avec succès" });
  };

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
      if (error) { const errorMessage = data?.error || error.message; throw new Error(errorMessage); }
      if (data?.error) throw new Error(data.error);
      toast({ title: "Notification envoyée", description: `${data?.emailsSent || 0} email(s) envoyé(s) aux membres` });
    } catch (error: unknown) {
      toast({ title: "Erreur d'envoi", description: error instanceof Error ? error.message : "Erreur inconnue", variant: "destructive" });
    } finally { setSending(false); }
  };

  const handleMontantChange = async (id: string, montant: number) => {
    if (isLocked && !isAdmin) return;
    await updateBeneficiaire.mutateAsync({ id, data: { montant_mensuel: montant } });
  };

  const handleMoisChange = async (id: string, mois: number | null) => {
    if (isLocked && !isAdmin) return;
    await updateBeneficiaire.mutateAsync({ id, data: { mois_benefice: mois } });
    setEditingBeneficiaire(null);

    if (mois !== null && calendrier.length > 1) {
      const updatedCalendrier = calendrier.map(b => b.id === id ? { ...b, mois_benefice: mois } : b);
      const sorted = [...updatedCalendrier].sort((a, b) => (a.mois_benefice || 13) - (b.mois_benefice || 13));
      const orderChanged = sorted.some((b, i) => b.id !== calendrier[i]?.id);
      if (orderChanged) {
        setPendingReorderUpdates(sorted.map((b, idx) => ({ id: b.id, rang: idx + 1 })));
        setShowReorderDialog(true);
      }
    }
  };

  // Add beneficiary directly to a specific month
  const handleAddToMonth = (moisNum: number | null) => {
    setSelectedMois(moisNum !== null ? String(moisNum) : "");
    setShowAddDialog(true);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Calendrier des Bénéficiaires
              </CardTitle>
              <CardDescription>
                Calendrier annuel groupé par mois — chaque mois affiche ses bénéficiaires
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
              <Button onClick={handleInitialize} disabled={initializeCalendrier.isPending} className="bg-gradient-to-r from-primary to-secondary">
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
                <Button variant="outline" onClick={handleSendNotification} disabled={sending}>
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

          {/* Month-grouped table */}
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
                  <TableHead className="w-32">Mois</TableHead>
                  <TableHead>Bénéficiaires</TableHead>
                  <TableHead className="w-36">Montant Mensuel</TableHead>
                  <TableHead className="w-36">Total (×12)</TableHead>
                  {!isLocked && isAdmin && <TableHead className="w-16"></TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {monthKeys.map(moisKey => {
                  const beneficiaires = groupedByMonth.get(moisKey) || [];
                  // Skip empty months except in admin mode
                  if (beneficiaires.length === 0 && !isAdmin) return null;

                  const moisLabel = moisKey !== null ? MOIS[moisKey - 1] : "Non défini";
                  const totalMensuel = beneficiaires.reduce((s: number, b: any) => s + Number(b.montant_mensuel), 0);
                  const totalAnnuel = beneficiaires.reduce((s: number, b: any) => s + Number(b.montant_total), 0);

                  return (
                    <TableRow key={moisKey ?? 'null'} className={beneficiaires.length === 0 ? "opacity-50" : ""}>
                      <TableCell className="font-medium align-top">
                        <div className="flex flex-col gap-1">
                          <span>{moisLabel}</span>
                          {beneficiaires.length > 1 && (
                            <Badge variant="outline" className="text-xs w-fit">
                              {beneficiaires.length} bénéf.
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {beneficiaires.length === 0 ? (
                          <span className="text-muted-foreground text-sm italic">Aucun bénéficiaire</span>
                        ) : (
                          <div className="flex flex-wrap gap-1.5">
                            {beneficiaires.map((b: any) => (
                              <div key={b.id} className="inline-flex items-center">
                                {!isLocked && isAdmin ? (
                                  <Popover open={editingBeneficiaire === b.id} onOpenChange={(open) => setEditingBeneficiaire(open ? b.id : null)}>
                                    <PopoverTrigger asChild>
                                      <Badge
                                        variant="secondary"
                                        className="cursor-pointer hover:bg-secondary/60 pr-1 gap-1 text-sm py-1"
                                      >
                                        {b.membres?.prenom} {b.membres?.nom}
                                        <span className="text-muted-foreground text-xs ml-1">
                                          ({formatFCFA(b.montant_mensuel)})
                                        </span>
                                        <button
                                          onClick={(e) => { e.stopPropagation(); setDeleteTargetId(b.id); }}
                                          className="ml-1 rounded-full hover:bg-destructive/20 p-0.5"
                                        >
                                          <X className="w-3 h-3 text-destructive" />
                                        </button>
                                      </Badge>
                                    </PopoverTrigger>
                                    <PopoverContent className="w-64 space-y-3" align="start">
                                      <p className="text-sm font-medium">{b.membres?.prenom} {b.membres?.nom}</p>
                                      <div>
                                        <Label className="text-xs">Mois</Label>
                                        <Select
                                          value={b.mois_benefice?.toString() || "none"}
                                          onValueChange={(v) => handleMoisChange(b.id, v === "none" ? null : parseInt(v))}
                                        >
                                          <SelectTrigger className="h-8 text-xs">
                                            <SelectValue />
                                          </SelectTrigger>
                                          <SelectContent>
                                            <SelectItem value="none">Non défini</SelectItem>
                                            {MOIS.map((m, i) => (
                                              <SelectItem key={i + 1} value={String(i + 1)}>{m}</SelectItem>
                                            ))}
                                          </SelectContent>
                                        </Select>
                                      </div>
                                      <div>
                                        <Label className="text-xs">Montant mensuel</Label>
                                        <Input
                                          type="number"
                                          value={b.montant_mensuel}
                                          onChange={(e) => handleMontantChange(b.id, parseFloat(e.target.value) || 0)}
                                          className="h-8 text-xs"
                                        />
                                      </div>
                                      <p className="text-xs text-muted-foreground">
                                        Total: {formatFCFA(b.montant_total)}
                                      </p>
                                    </PopoverContent>
                                  </Popover>
                                ) : (
                                  <Badge variant="secondary" className="text-sm py-1">
                                    {b.membres?.prenom} {b.membres?.nom}
                                    <span className="text-muted-foreground text-xs ml-1">
                                      ({formatFCFA(b.montant_mensuel)})
                                    </span>
                                  </Badge>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="align-top font-medium">
                        {beneficiaires.length > 0 ? formatFCFA(totalMensuel) : "-"}
                      </TableCell>
                      <TableCell className="align-top font-semibold">
                        {beneficiaires.length > 0 ? formatFCFA(totalAnnuel) : "-"}
                      </TableCell>
                      {!isLocked && isAdmin && (
                        <TableCell className="align-top">
                          {moisKey !== null && (
                            <Button variant="ghost" size="icon" onClick={() => handleAddToMonth(moisKey)} title="Ajouter à ce mois">
                              <Plus className="w-4 h-4" />
                            </Button>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })}
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

      {/* Dialog d'ajout */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Ajouter un bénéficiaire</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Membre</Label>
              <Select value={selectedMembre} onValueChange={setSelectedMembre}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un membre" /></SelectTrigger>
                <SelectContent>
                  {membresDisponibles.map(m => (
                    <SelectItem key={m.id} value={m.id}>{m.prenom} {m.nom}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Mois de bénéfice</Label>
              <Select value={selectedMois} onValueChange={setSelectedMois}>
                <SelectTrigger><SelectValue placeholder="Sélectionner un mois" /></SelectTrigger>
                <SelectContent>
                  {MOIS.map((mois, index) => {
                    const count = calendrier.filter(c => c.mois_benefice === index + 1).length;
                    return (
                      <SelectItem key={index + 1} value={String(index + 1)}>
                        {mois} {count > 0 && `(${count} bénéf.)`}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {selectedMois && calendrier.filter(c => c.mois_benefice === parseInt(selectedMois)).length > 0 ? (
                <p className="text-xs text-amber-600 mt-1 bg-amber-50 dark:bg-amber-900/20 p-2 rounded">
                  ℹ️ Ce mois compte déjà {calendrier.filter(c => c.mois_benefice === parseInt(selectedMois)).length} bénéficiaire(s).
                </p>
              ) : (
                <p className="text-xs text-muted-foreground mt-1">
                  {selectedMois ? "Ce sera le seul bénéficiaire de ce mois." : "Sélectionnez un mois."}
                </p>
              )}
            </div>
          </div>
          {selectedMembre && selectedMois && (() => {
            const cotisation = cotisationsMensuelles.find(c => c.membre_id === selectedMembre);
            const montantMensuel = cotisation?.montant || 20000;
            const montantTotal = montantMensuel * 12;
            return (
              <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg">
                <p className="text-sm font-medium text-primary">
                  Montant total prévu : {formatFCFA(montantMensuel)} × 12 = <span className="font-bold">{formatFCFA(montantTotal)}</span>
                </p>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>Annuler</Button>
            <Button onClick={handleAdd} disabled={!selectedMembre || !selectedMois}>Ajouter</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialog suppression */}
      <AlertDialog open={!!deleteTargetId} onOpenChange={(open) => { if (!open) setDeleteTargetId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce bénéficiaire ?</AlertDialogTitle>
            <AlertDialogDescription>Ce bénéficiaire sera retiré du calendrier. Cette action est irréversible.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => { if (deleteTargetId) { deleteBeneficiaire.mutate(deleteTargetId); setDeleteTargetId(null); } }}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog réordonnement */}
      <AlertDialog open={showReorderDialog} onOpenChange={setShowReorderDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réordonner les rangs ?</AlertDialogTitle>
            <AlertDialogDescription>Le mois a été modifié. Voulez-vous réordonner automatiquement les rangs selon l'ordre chronologique des mois ?</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setPendingReorderUpdates([])}>Non</AlertDialogCancel>
            <AlertDialogAction onClick={async () => {
              if (pendingReorderUpdates.length > 0) {
                await reorderBeneficiaires.mutateAsync(pendingReorderUpdates);
                setPendingReorderUpdates([]);
              }
            }}>Oui, réordonner</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
