import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Gift, Check, X, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { calculateSoldeNetBeneficiaire } from "@/lib/beneficiairesCalculs";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

interface BeneficiairesReunionManagerProps {
  reunionId?: string;
}

export default function BeneficiairesReunionManager({ reunionId }: BeneficiairesReunionManagerProps) {
  const [selectedMembreId, setSelectedMembreId] = useState<string>("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: membres } = useQuery({
    queryKey: ['membres-actifs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membres')
        .select('*')
        .eq('statut', 'actif')
        .order('nom');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: beneficiaires } = useQuery({
    queryKey: ['beneficiaires-reunion', reunionId],
    queryFn: async () => {
      if (!reunionId) return [];
      
      const { data, error } = await supabase
        .from('reunion_beneficiaires')
        .select(`
          *,
          membres:membre_id (
            id,
            nom,
            prenom,
            telephone
          ),
          reunions:reunion_id (
            id,
            sujet,
            date_reunion
          )
        `)
        .eq('reunion_id', reunionId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    },
    enabled: !!reunionId
  });

  const assignerBeneficiaire = useMutation({
    mutationFn: async (membreId: string) => {
      if (!reunionId) throw new Error("Aucune réunion sélectionnée");

      // Vérifier si un bénéficiaire existe déjà
      const { data: existing } = await supabase
        .from('reunion_beneficiaires')
        .select('id')
        .eq('reunion_id', reunionId)
        .single();

      if (existing) {
        throw new Error("Un bénéficiaire est déjà assigné à cette réunion");
      }

      // Calculer le montant du bénéfice
      const montantBenefice = 50000; // À calculer selon la configuration

      const { error } = await supabase
        .from('reunion_beneficiaires')
        .insert({
          reunion_id: reunionId,
          membre_id: membreId,
          montant_benefice: montantBenefice,
          statut: 'en_attente',
          date_benefice_prevue: new Date().toISOString()
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaires-reunion'] });
      toast({ 
        title: "Bénéficiaire assigné", 
        description: "Le bénéficiaire a été assigné avec succès" 
      });
      setSelectedMembreId("");
    },
    onError: (error: Error) => {
      toast({ 
        title: "Erreur", 
        description: error.message, 
        variant: "destructive" 
      });
    }
  });

  const marquerCommePaye = useMutation({
    mutationFn: async (beneficiaireId: string) => {
      const { error } = await supabase
        .from('reunion_beneficiaires')
        .update({ 
          statut: 'paye',
          date_paiement: new Date().toISOString()
        })
        .eq('id', beneficiaireId);

      if (error) throw error;

      // Enregistrer dans fond_caisse_operations
      const beneficiaire = beneficiaires?.find(b => b.id === beneficiaireId);
      if (beneficiaire) {
        const { error: opError } = await supabase
          .from('fond_caisse_operations')
          .insert({
            type_operation: 'sortie',
            libelle: `Paiement bénéfice tontine - ${beneficiaire.membres?.prenom} ${beneficiaire.membres?.nom}`,
            montant: beneficiaire.montant_benefice,
            beneficiaire_id: beneficiaire.membre_id,
            operateur_id: (await supabase.auth.getUser()).data.user?.id || '',
            date_operation: new Date().toISOString()
          });
        
        if (opError) console.error('Erreur enregistrement fond caisse:', opError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaires-reunion'] });
      toast({ title: "Paiement confirmé" });
    }
  });

  const annulerBeneficiaire = useMutation({
    mutationFn: async (beneficiaireId: string) => {
      const { error } = await supabase
        .from('reunion_beneficiaires')
        .delete()
        .eq('id', beneficiaireId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['beneficiaires-reunion'] });
      toast({ title: "Bénéficiaire annulé" });
    }
  });

  if (!reunionId) {
    return (
      <Card>
        <CardContent className="p-6">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Sélectionnez une réunion pour gérer ses bénéficiaires
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Gestion du Bénéficiaire
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Formulaire d'assignation */}
          {beneficiaires?.length === 0 && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Select value={selectedMembreId} onValueChange={setSelectedMembreId}>
                  <SelectTrigger className="flex-1">
                    <SelectValue placeholder="Sélectionner un membre" />
                  </SelectTrigger>
                  <SelectContent>
                    {membres?.map((membre) => (
                      <SelectItem key={membre.id} value={membre.id}>
                        {membre.nom} {membre.prenom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button
                  onClick={() => assignerBeneficiaire.mutate(selectedMembreId)}
                  disabled={!selectedMembreId || assignerBeneficiaire.isPending}
                >
                  Assigner
                </Button>
              </div>
            </div>
          )}

          {/* Liste des bénéficiaires */}
          {beneficiaires && beneficiaires.length > 0 && (
            <div className="space-y-3">
              {beneficiaires.map((beneficiaire) => (
                <div key={beneficiaire.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-semibold">
                          {beneficiaire.membres?.prenom} {beneficiaire.membres?.nom}
                        </h4>
                        <Badge variant={
                          beneficiaire.statut === 'paye' ? 'default' : 
                          beneficiaire.statut === 'en_attente' ? 'secondary' : 
                          'destructive'
                        }>
                          {beneficiaire.statut === 'paye' ? 'Payé' : 
                           beneficiaire.statut === 'en_attente' ? 'En attente' : 
                           'Annulé'}
                        </Badge>
                      </div>
                      <div className="text-sm text-muted-foreground space-y-1">
                        <p>Montant: <span className="font-medium">{beneficiaire.montant_benefice.toLocaleString()} FCFA</span></p>
                        <p>Date prévue: {format(new Date(beneficiaire.date_benefice_prevue), 'PPP', { locale: fr })}</p>
                        {beneficiaire.date_paiement && (
                          <p>Date paiement: {format(new Date(beneficiaire.date_paiement), 'PPP', { locale: fr })}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {beneficiaire.statut === 'en_attente' && (
                        <>
                          <Button
                            size="sm"
                            variant="default"
                            onClick={() => marquerCommePaye.mutate(beneficiaire.id)}
                            disabled={marquerCommePaye.isPending}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Confirmer
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              if (confirm("Êtes-vous sûr d'annuler ce bénéficiaire ?")) {
                                annulerBeneficiaire.mutate(beneficiaire.id);
                              }
                            }}
                            disabled={annulerBeneficiaire.isPending}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Annuler
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
