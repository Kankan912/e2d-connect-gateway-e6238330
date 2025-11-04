import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CheckCircle, AlertCircle, Users, FileText, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

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

  // Récupérer les présences
  const { data: presences } = useQuery({
    queryKey: ['reunion-presences-cloture', reunionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reunion_presences')
        .select(`
          present,
          membres:membre_id (
            nom,
            prenom,
            email
          )
        `)
        .eq('reunion_id', reunionId)
        .eq('present', true);

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

  const presentsCount = presences?.length || 0;
  const pointsCRCount = comptesRendus?.length || 0;
  const canClose = presentsCount > 0 && pointsCRCount > 0;

  const handleCloturer = async () => {
    if (!canClose) return;

    setProcessing(true);
    try {
      // Récupérer les emails des membres présents
      const emails = presences
        ?.map((p: any) => p.membres?.email)
        .filter(Boolean) || [];

      if (emails.length === 0) {
        toast({
          title: "Attention",
          description: "Aucun email valide trouvé pour les membres présents",
          variant: "destructive",
        });
        return;
      }

      // Préparer le contenu du CR
      const contenuCR = comptesRendus
        ?.map((cr: any, index: number) =>
          `${index + 1}. ${cr.sujet}\n   ${cr.resolution || 'Aucune résolution'}`
        )
        .join('\n\n') || 'Aucun point à l\'ordre du jour';

      // Appeler l'edge function pour envoyer les emails
      const { error: emailError } = await supabase.functions.invoke('send-reunion-cr', {
        body: {
          reunionId,
          destinataires: emails,
          sujet: reunionData.sujet || 'Réunion',
          contenu: contenuCR,
          dateReunion: reunionData.date_reunion
        }
      });

      if (emailError) throw emailError;

      // Mettre à jour le statut de la réunion
      const { error: updateError } = await supabase
        .from('reunions')
        .update({ statut: 'terminee' })
        .eq('id', reunionId);

      if (updateError) throw updateError;

      toast({
        title: "Succès",
        description: `Réunion clôturée et compte-rendu envoyé à ${emails.length} membre(s)`,
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
            <CheckCircle className="h-5 w-5" />
            Clôturer la Réunion
          </DialogTitle>
          <DialogDescription>
            Confirmez la clôture de la réunion et l'envoi du compte-rendu
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
                    {presences?.map((presence: any, index: number) => (
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

          {/* Avertissement */}
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
