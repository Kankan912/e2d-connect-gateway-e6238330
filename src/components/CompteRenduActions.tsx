import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, FileText, CheckCircle, Users } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQuery } from '@tanstack/react-query';

interface Reunion {
  id: string;
  sujet?: string;
  date_reunion: string;
  statut: string;
}

interface CompteRenduActionsProps {
  reunion: Reunion;
  onSuccess?: () => void;
}

export default function CompteRenduActions({ reunion, onSuccess }: CompteRenduActionsProps) {
  const [open, setOpen] = useState(false);
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  // Récupérer les membres présents à la réunion
  const { data: presences } = useQuery({
    queryKey: ['reunion-presences', reunion.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reunion_presences')
        .select(`
          membre_id,
          membres:membre_id (
            id,
            nom,
            prenom,
            email
          )
        `)
        .eq('reunion_id', reunion.id)
        .eq('present', true);

      if (error) throw error;
      return data;
    },
    enabled: open
  });

  // Récupérer les points du compte-rendu
  const { data: comptesRendus } = useQuery({
    queryKey: ['comptes-rendus', reunion.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('rapports_seances')
        .select('*')
        .eq('reunion_id', reunion.id)
        .order('numero_ordre', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: open
  });

  const handleConfirmerEtNotifier = async () => {
    setSending(true);
    try {
      // Récupérer les emails des membres présents
      const emails = presences
        ?.map((p: any) => p.membres?.email)
        .filter(Boolean) || [];

      if (emails.length === 0) {
        toast({
          title: "Erreur",
          description: "Aucun membre présent avec email valide",
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
      const { data, error } = await supabase.functions.invoke('send-reunion-cr', {
        body: {
          reunionId: reunion.id,
          destinataires: emails,
          sujet: reunion.sujet || 'Réunion',
          contenu: contenuCR,
          dateReunion: reunion.date_reunion
        }
      });

      if (error) throw error;

      // Mettre à jour le statut de la réunion
      await supabase
        .from('reunions')
        .update({ statut: 'terminee' })
        .eq('id', reunion.id);

      toast({
        title: "Succès",
        description: `Compte-rendu envoyé à ${emails.length} membre(s)`,
      });

      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Erreur envoi CR:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer le compte-rendu: " + error.message,
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  const destinatairesCount = presences?.length || 0;
  const pointsCRCount = comptesRendus?.length || 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-primary to-secondary">
          <Send className="w-4 h-4 mr-2" />
          Confirmer et Notifier
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Envoi du Compte-Rendu
          </DialogTitle>
          <DialogDescription>
            Confirmez l'envoi du compte-rendu à tous les membres présents
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
                <Badge>{reunion.sujet || 'Sans titre'}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Date</span>
                <span className="text-sm font-medium">
                  {new Date(reunion.date_reunion).toLocaleDateString('fr-FR')}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Points à l'ordre du jour</span>
                <Badge variant="outline">{pointsCRCount}</Badge>
              </div>
            </CardContent>
          </Card>

          {/* Destinataires */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4" />
                Destinataires ({destinatairesCount})
              </CardTitle>
              <CardDescription>
                Le compte-rendu sera envoyé aux membres présents
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-32">
                <div className="space-y-2">
                  {presences?.map((presence: any) => (
                    <div
                      key={presence.membre_id}
                      className="flex items-center justify-between p-2 rounded-lg bg-muted"
                    >
                      <span className="text-sm font-medium">
                        {presence.membres?.prenom} {presence.membres?.nom}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {presence.membres?.email || 'Pas d\'email'}
                      </span>
                    </div>
                  ))}
                  {destinatairesCount === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">
                      Aucun membre présent enregistré
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Aperçu du contenu */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aperçu du Contenu</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-32">
                <div className="text-sm space-y-2 whitespace-pre-wrap">
                  {comptesRendus?.map((cr: any, index: number) => (
                    <div key={cr.id} className="border-l-2 border-primary pl-3">
                      <p className="font-medium">
                        Point {index + 1}: {cr.sujet}
                      </p>
                      <p className="text-muted-foreground text-xs mt-1">
                        {cr.resolution || 'Aucune résolution'}
                      </p>
                    </div>
                  ))}
                  {pointsCRCount === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      Aucun point à l'ordre du jour
                    </p>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              onClick={handleConfirmerEtNotifier}
              disabled={sending || destinatairesCount === 0 || pointsCRCount === 0}
              className="bg-gradient-to-r from-primary to-secondary"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              {sending ? "Envoi en cours..." : `Envoyer à ${destinatairesCount} membre(s)`}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

