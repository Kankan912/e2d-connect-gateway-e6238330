import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Gift, Check, AlertCircle, Plus, Loader2, User } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useBeneficiairesReunion, useCalendrierBeneficiaires } from "@/hooks/useCalendrierBeneficiaires";
import { formatFCFA } from "@/lib/utils";
import AssignerBeneficiaireModal from "@/components/beneficiaires/AssignerBeneficiaireModal";
import ValiderPaiementBeneficiaireModal from "@/components/beneficiaires/ValiderPaiementBeneficiaireModal";

interface BeneficiairesReunionWidgetProps {
  reunionId: string;
  reunionDate: string;
  exerciceId?: string;
  isReadOnly?: boolean;
}

const MOIS = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre"
];

export default function BeneficiairesReunionWidget({ 
  reunionId, 
  reunionDate,
  exerciceId,
  isReadOnly = false 
}: BeneficiairesReunionWidgetProps) {
  const [showAssignDialog, setShowAssignDialog] = useState(false);
  const [showPayDialog, setShowPayDialog] = useState(false);
  const [selectedBeneficiaireId, setSelectedBeneficiaireId] = useState<string | null>(null);
  const [montantParDefaut, setMontantParDefaut] = useState<number | null>(null);

  const { beneficiaires, isLoading, assignerBeneficiaire } = useBeneficiairesReunion(reunionId);

  // Récupérer l'exercice de la réunion si non fourni
  const { data: exercice } = useQuery({
    queryKey: ['exercice-reunion', reunionDate],
    queryFn: async () => {
      if (exerciceId) return { id: exerciceId };

      const { data, error } = await supabase
        .from('exercices')
        .select('id')
        .lte('date_debut', reunionDate)
        .gte('date_fin', reunionDate)
        .single();

      if (error) return null;
      return data;
    },
    enabled: !exerciceId
  });

  const currentExerciceId = exerciceId || exercice?.id;

  // Récupérer le calendrier des bénéficiaires
  const { calendrier, calculerMontant } = useCalendrierBeneficiaires(currentExerciceId);

  // Mois de la réunion
  const reunionMois = new Date(reunionDate).getMonth() + 1;

  // Bénéficiaires du mois selon le calendrier
  const beneficiairesDuMois = calendrier.filter(c => c.mois_benefice === reunionMois);

  // Bénéficiaires déjà assignés
  const dejaAssignes = beneficiaires.map(b => b.membre_id);

  // Bénéficiaires disponibles pour assignation
  const disponibles = beneficiairesDuMois.filter(c => !dejaAssignes.includes(c.membre_id));

  const handleAssign = async (payload: {
    calendrierId: string;
    membreId: string;
    montantBrut: number;
    sanctionsImpayees: number;
    montantNet: number;
  }) => {
    if (!currentExerciceId) return;
    await assignerBeneficiaire.mutateAsync({
      reunionId,
      membreId: payload.membreId,
      calendrierId: payload.calendrierId,
      exerciceId: currentExerciceId,
      montantBrut: payload.montantBrut,
      deductions: { sanctions_impayees: payload.sanctionsImpayees },
      montantFinal: payload.montantNet
    });
  };

  const openPayDialog = (id: string) => {
    const b = beneficiaires.find((x: any) => x.id === id) as any;
    setSelectedBeneficiaireId(id);
    setMontantParDefaut(b?.montant_final ?? b?.montant_benefice ?? null);
    setShowPayDialog(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-6 flex justify-center">
          <Loader2 className="w-6 h-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-l-4 border-l-primary">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Gift className="h-5 w-5 text-primary" />
            Bénéficiaires du mois
            <Badge variant="outline">{MOIS[reunionMois - 1]}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Bénéficiaires prévus selon le calendrier */}
          {beneficiairesDuMois.length > 0 && disponibles.length > 0 && !isReadOnly && (
            <Alert>
              <User className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>
                  {disponibles.length} bénéficiaire(s) prévu(s) ce mois: {' '}
                  {disponibles.map(d => `${d.membres?.prenom} ${d.membres?.nom}`).join(', ')}
                </span>
                <Button 
                  size="sm" 
                  variant="outline"
                  onClick={() => setShowAssignDialog(true)}
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Assigner
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Liste des bénéficiaires assignés */}
          {beneficiaires.length > 0 ? (
            <div className="space-y-3">
              {beneficiaires.map((benef: any) => {
                // Calculer le délai depuis l'assignation
                const joursDepuisAssignation = benef.created_at 
                  ? Math.floor((Date.now() - new Date(benef.created_at).getTime()) / (1000 * 60 * 60 * 24))
                  : 0;
                const isOverdue = benef.statut !== 'paye' && joursDepuisAssignation > 7;
                
                return (
                  <div
                    key={benef.id}
                    className={`p-4 rounded-lg border ${
                      benef.statut === 'paye' 
                        ? 'bg-success/10 border-success/30' 
                        : isOverdue
                          ? 'bg-destructive/10 border-destructive/30'
                          : 'bg-muted/50 border-border'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <p className="font-semibold">
                          {benef.membres?.nom} {benef.membres?.prenom}
                        </p>
                        <div className="text-sm space-y-1">
                          <p>
                            <span className="text-muted-foreground">Montant brut:</span>{' '}
                            {formatFCFA(benef.montant_brut || benef.montant_benefice)}
                          </p>
                          {benef.deductions && Object.keys(benef.deductions).length > 0 && (
                            <p className="text-destructive">
                              <span className="text-muted-foreground">Déductions:</span>{' '}
                              -{formatFCFA(Object.values(benef.deductions as Record<string, number>).reduce((a, b) => a + b, 0))}
                            </p>
                          )}
                          <p className="font-semibold text-primary">
                            <span className="text-muted-foreground">Montant net:</span>{' '}
                            {formatFCFA(benef.montant_final || benef.montant_benefice)}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <Badge 
                          variant={benef.statut === 'paye' ? 'default' : isOverdue ? 'destructive' : 'secondary'}
                          className={benef.statut === 'paye' ? 'bg-success' : ''}
                        >
                          {benef.statut === 'paye' ? (
                            <><Check className="w-3 h-3 mr-1" />Payé</>
                          ) : benef.statut === 'partiel' ? (
                            'Partiel'
                          ) : isOverdue ? (
                            <><AlertCircle className="w-3 h-3 mr-1" />En retard</>
                          ) : (
                            'Impayé'
                          )}
                        </Badge>
                        {benef.statut !== 'paye' && !isReadOnly && (
                          <Button
                            size="sm"
                            onClick={() => openPayDialog(benef.id)}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Marquer payé
                          </Button>
                        )}
                      </div>
                    </div>
                    {benef.date_paiement && (
                      <p className="text-xs text-muted-foreground mt-2">
                        Payé le {new Date(benef.date_paiement).toLocaleDateString('fr-FR')}
                        {benef.notes && ` - ${benef.notes}`}
                      </p>
                    )}
                    {isOverdue && !benef.date_paiement && (
                      <p className="text-xs text-destructive mt-2">
                        ⚠️ En attente depuis {joursDepuisAssignation} jours
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <Gift className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>Aucun bénéficiaire assigné pour cette réunion</p>
            </div>
          )}

          {/* Statistiques */}
          {beneficiaires.length > 0 && (
            <div className="grid grid-cols-2 gap-4 pt-2 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-primary">
                  {formatFCFA(beneficiaires.reduce((sum: number, b: any) => sum + (b.montant_final || b.montant_benefice), 0))}
                </p>
                <p className="text-xs text-muted-foreground">Total à verser</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-success">
                  {formatFCFA(
                    beneficiaires
                      .filter((b: any) => b.statut === 'paye')
                      .reduce((sum: number, b: any) => sum + (b.montant_final || b.montant_benefice), 0)
                  )}
                </p>
                <p className="text-xs text-muted-foreground">Déjà payé</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AssignerBeneficiaireModal
        open={showAssignDialog}
        onOpenChange={setShowAssignDialog}
        disponibles={disponibles as any}
        exerciceId={currentExerciceId}
        isPending={assignerBeneficiaire.isPending}
        calculerMontant={calculerMontant as any}
        onConfirm={handleAssign}
      />

      <ValiderPaiementBeneficiaireModal
        open={showPayDialog}
        onOpenChange={setShowPayDialog}
        beneficiaireId={selectedBeneficiaireId}
        montantParDefaut={montantParDefaut}
        reunionId={reunionId}
      />
    </>
  );
}
