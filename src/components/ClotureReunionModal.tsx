import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, AlertCircle, Users, FileText, Send, Lock, AlertTriangle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery, useQueryClient } from '@tanstack/react-query';

interface ClotureReunionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reunionId: string;
  reunionData: {
    sujet?: string;
    date_reunion: string;
  };
  onSuccess?: () => void;
}

export default function ClotureReunionModal({
  open,
  onOpenChange,
  reunionId,
  reunionData,
  onSuccess
}: ClotureReunionModalProps) {
  const [processing, setProcessing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Récupérer tous les membres E2D actifs
  const { data: membresE2D } = useQuery({
    queryKey: ['membres-e2d-cloture'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membres')
        .select('id, nom, prenom, email')
        .eq('statut', 'actif')
        .eq('est_membre_e2d', true);
      if (error) throw error;
      return data;
    },
    enabled: open
  });

  // Récupérer les présences depuis reunions_presences
  const { data: presences } = useQuery({
    queryKey: ['reunion-presences-cloture', reunionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reunions_presences')
        .select(`
          membre_id,
          statut_presence,
          membres:membre_id (
            nom,
            prenom,
            email
          )
        `)
        .eq('reunion_id', reunionId);

      if (error) throw error;
      return data;
    },
    enabled: open
  });

  // Récupérer les points du compte-rendu
  const { data: comptesRendus } = useQuery({
    queryKey: ['comptes-rendus-cloture', reunionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rapports_seances')
        .select('*')
        .eq('reunion_id', reunionId)
        .order('numero_ordre', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: open
  });

  // Récupérer la configuration des sanctions pour absence depuis les configurations
  const { data: sanctionConfig } = useQuery({
    queryKey: ['sanction-absence-config'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('configurations')
        .select('valeur')
        .eq('cle', 'sanction_absence_montant')
        .maybeSingle();
      if (error) throw error;
      return data ? { montant: parseFloat(data.valeur) } : { montant: 500 }; // Défaut 500 FCFA
    },
    enabled: open
  });

  const presentsCount = presences?.filter(p => p.statut_presence === 'present').length || 0;
  const pointsCRCount = comptesRendus?.length || 0;
  const canClose = presentsCount > 0 && pointsCRCount > 0;

  // Calculer les membres non marqués (qui n'ont pas d'enregistrement de présence)
  const membresNonMarques = membresE2D?.filter(
    m => !presences?.some(p => p.membre_id === m.id)
  ) || [];

  const handleCloturer = async () => {
    if (!canClose) return;

    setProcessing(true);
    try {
      // === ÉTAPE 1: Traiter les membres non marqués comme absents non excusés ===
      if (membresNonMarques.length > 0) {
        const absencesACreer = membresNonMarques.map(m => ({
          reunion_id: reunionId,
          membre_id: m.id,
          statut_presence: 'absent_non_excuse',
          present: false,
        }));

        const { error: insertError } = await supabase
          .from('reunions_presences')
          .insert(absencesACreer);

        if (insertError) throw insertError;
      }

      // === ÉTAPE 2: Récupérer tous les absents non excusés pour sanctions ===
      const { data: tousAbsentsNonExcuses } = await supabase
        .from('reunions_presences')
        .select('membre_id')
        .eq('reunion_id', reunionId)
        .eq('statut_presence', 'absent_non_excuse');

      // === ÉTAPE 3: Créer les sanctions automatiques pour les absents non excusés ===
      if (tousAbsentsNonExcuses && tousAbsentsNonExcuses.length > 0 && sanctionConfig) {
        const sanctionsACreer = tousAbsentsNonExcuses.map(abs => ({
          reunion_id: reunionId,
          membre_id: abs.membre_id,
          type_sanction: 'absence',
          montant_amende: sanctionConfig.montant || 500,
          montant_paye: 0,
          motif: 'Absence non excusée à la réunion',
          statut: 'impaye',
        }));

        const { error: sanctionError } = await supabase
          .from('reunions_sanctions')
          .insert(sanctionsACreer);

        if (sanctionError) {
          console.error('Erreur création sanctions:', sanctionError);
          // On continue même si les sanctions échouent
        }
      }

      // === ÉTAPE 4: Récupérer les infos des membres présents pour l'envoi du CR ===
      const { data: presentsData } = await supabase
        .from('reunions_presences')
        .select('membres:membre_id (nom, prenom, email)')
        .eq('reunion_id', reunionId)
        .eq('statut_presence', 'present');

      // Formater les destinataires comme attendu par l'edge function
      const destinataires = presentsData
        ?.filter((p: any) => p.membres?.email)
        .map((p: any) => ({
          email: p.membres.email,
          nom: p.membres.nom,
          prenom: p.membres.prenom
        })) || [];

      if (destinataires.length === 0) {
        toast({
          title: "Attention",
          description: "Aucun email valide trouvé pour les membres présents",
          variant: "destructive",
        });
        setProcessing(false);
        return;
      }

      // === ÉTAPE 5: Préparer et envoyer le compte-rendu par email ===
      const contenuCR = comptesRendus
        ?.map((cr: any, index: number) =>
          `${index + 1}. ${cr.sujet}\n   ${cr.resolution || 'Aucune résolution'}`
        )
        .join('\n\n') || 'Aucun point à l\'ordre du jour';

      const { error: emailError } = await supabase.functions.invoke('send-reunion-cr', {
        body: {
          reunionId,
          destinataires,
          sujet: reunionData.sujet || 'Réunion',
          contenu: contenuCR,
          dateReunion: reunionData.date_reunion
        }
      });

      if (emailError) throw emailError;

      // === ÉTAPE 6: Mettre à jour le statut de la réunion à "terminee" ===
      const { error: updateError } = await supabase
        .from('reunions')
        .update({ statut: 'terminee' })
        .eq('id', reunionId);

      if (updateError) throw updateError;

      // Invalider les caches pour rafraîchir les données
      queryClient.invalidateQueries({ queryKey: ['reunion-presences'] });
      queryClient.invalidateQueries({ queryKey: ['reunion-presences-cloture'] });
      queryClient.invalidateQueries({ queryKey: ['presences-all'] });
      queryClient.invalidateQueries({ queryKey: ['reunions'] });
      queryClient.invalidateQueries({ queryKey: ['reunions-cloturees'] });
      queryClient.invalidateQueries({ queryKey: ['reunions-sanctions'] });
      const nbSanctions = tousAbsentsNonExcuses?.length || 0;
      toast({
        title: "Réunion clôturée avec succès",
        description: `CR envoyé à ${destinataires.length} membre(s). ${nbSanctions > 0 ? `${nbSanctions} sanction(s) créée(s) pour absence.` : ''}`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Erreur clôture réunion:', error);
      toast({
        title: "Erreur",
        description: "Impossible de clôturer la réunion: " + error.message,
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Clôturer la Réunion
          </DialogTitle>
          <DialogDescription>
            La clôture est définitive : elle bloque les modifications, applique les sanctions et envoie le compte-rendu.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Résumé */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Résumé</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Réunion</span>
                <Badge>{reunionData.sujet || 'Sans titre'}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Date</span>
                <span className="text-sm font-medium">
                  {new Date(reunionData.date_reunion).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Vérifications */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Vérifications</CardTitle>
              <CardDescription>
                Assurez-vous que toutes les conditions sont remplies
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {presentsCount > 0 ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">Membres présents enregistrés</span>
                </div>
                <Badge variant={presentsCount > 0 ? 'default' : 'destructive'}>
                  {presentsCount}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {pointsCRCount > 0 ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  <span className="text-sm">Points à l'ordre du jour</span>
                </div>
                <Badge variant={pointsCRCount > 0 ? 'default' : 'destructive'}>
                  {pointsCRCount}
                </Badge>
              </div>
            </CardContent>
          </Card>

          {/* Avertissement membres non marqués */}
          {membresNonMarques.length > 0 && (
            <Card className="border-orange-500 bg-orange-50 dark:bg-orange-950">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-600 dark:text-orange-400 mt-0.5" />
                  <div className="text-sm text-orange-800 dark:text-orange-200">
                    <p className="font-medium mb-1">{membresNonMarques.length} membre(s) non marqué(s)</p>
                    <p>
                      Ces membres seront automatiquement marqués comme <strong>absents non excusés</strong> et 
                      recevront une sanction.
                    </p>
                    <div className="mt-2 text-xs">
                      {membresNonMarques.slice(0, 5).map(m => m.prenom + ' ' + m.nom).join(', ')}
                      {membresNonMarques.length > 5 && ` et ${membresNonMarques.length - 5} autre(s)...`}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Destinataires */}
          {presentsCount > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  Destinataires du CR ({presentsCount})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-24">
                  <div className="space-y-2">
                    {presences?.filter(p => p.statut_presence === 'present').map((presence: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center justify-between p-2 rounded-lg bg-muted text-sm"
                      >
                        <span>
                          {presence.membres?.prenom} {presence.membres?.nom}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {presence.membres?.email || 'Pas d\'email'}
                        </span>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}

          {/* Avertissement conditions non remplies */}
          {!canClose && (
            <Card className="border-yellow-500 bg-yellow-50 dark:bg-yellow-950">
              <CardContent className="pt-4">
                <div className="flex items-start gap-2">
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400 mt-0.5" />
                  <div className="text-sm text-yellow-800 dark:text-yellow-200">
                    <p className="font-medium mb-1">Conditions non remplies</p>
                    <p>
                      Veuillez enregistrer au moins un membre présent et un point à l'ordre du jour
                      avant de clôturer la réunion.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleCloturer}
              disabled={!canClose || processing}
              className="bg-gradient-to-r from-primary to-secondary"
            >
              {processing ? (
                <>Traitement en cours...</>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2" />
                  Clôturer et Envoyer
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
