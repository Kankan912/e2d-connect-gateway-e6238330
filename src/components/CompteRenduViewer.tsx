import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit, Download, FileText, Calendar, Users, Clock } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Reunion {
  id: string;
  sujet?: string;
  date_reunion: string;
  statut: string;
  lieu_description?: string;
}

interface CompteRenduViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reunion: Reunion;
  onEdit?: () => void;
}

export default function CompteRenduViewer({ open, onOpenChange, reunion, onEdit }: CompteRenduViewerProps) {
  const [downloading, setDownloading] = useState(false);

  // Récupérer les points du compte-rendu
  const { data: comptesRendus, isLoading } = useQuery({
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

  // Récupérer les présences
  const { data: presences } = useQuery({
    queryKey: ['reunion-presences', reunion.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reunion_presences')
        .select(`
          present,
          membres:membre_id (
            nom,
            prenom
          )
        `)
        .eq('reunion_id', reunion.id)
        .eq('present', true);

      if (error) throw error;
      return data;
    },
    enabled: open
  });

  const handleDownloadPDF = async () => {
    setDownloading(true);
    try {
      // Logique d'export PDF à implémenter
      console.log('Téléchargement PDF du compte-rendu', reunion.id);
    } catch (error) {
      console.error('Erreur téléchargement PDF:', error);
    } finally {
      setDownloading(false);
    }
  };

  const pointsCRCount = comptesRendus?.length || 0;
  const presentsCount = presences?.length || 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Compte-Rendu de Réunion
          </DialogTitle>
          <DialogDescription>
            Consultation du compte-rendu
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[70vh]">
          <div className="space-y-4 pr-4">
            {/* En-tête */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center justify-between">
                  <span>Informations Générales</span>
                  <Badge variant={reunion.statut === 'terminee' ? 'default' : 'outline'}>
                    {reunion.statut === 'terminee' ? 'Terminée' : reunion.statut}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-2 text-sm">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Sujet:</span>
                  <span>{reunion.sujet || 'Sans titre'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Date:</span>
                  <span>
                    {format(new Date(reunion.date_reunion), 'PPP', { locale: fr })}
                  </span>
                </div>
                {reunion.lieu_description && (
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">Lieu:</span>
                    <span>{reunion.lieu_description}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Présents:</span>
                  <Badge variant="outline">{presentsCount}</Badge>
                </div>
              </CardContent>
            </Card>

            {/* Liste des présents */}
            {presentsCount > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Membres Présents ({presentsCount})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {presences?.map((presence: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted text-sm"
                      >
                        <span>
                          {presence.membres?.prenom} {presence.membres?.nom}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Points à l'ordre du jour */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Points à l'Ordre du Jour ({pointsCRCount})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Chargement...
                  </p>
                ) : pointsCRCount === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucun point à l'ordre du jour
                  </p>
                ) : (
                  <div className="space-y-4">
                    {comptesRendus?.map((cr: any) => (
                      <div
                        key={cr.id}
                        className="border-l-4 border-primary pl-4 py-2 space-y-2"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-base">
                              {cr.numero_ordre}. {cr.sujet}
                            </p>
                            {cr.description && (
                              <p className="text-sm text-muted-foreground mt-1">
                                {cr.description}
                              </p>
                            )}
                          </div>
                        </div>
                        {cr.resolution && (
                          <div className="bg-muted p-3 rounded-lg">
                            <p className="text-sm font-medium mb-1">Résolution:</p>
                            <p className="text-sm whitespace-pre-wrap">{cr.resolution}</p>
                          </div>
                        )}
                        {cr.decisions && (
                          <div className="bg-muted p-3 rounded-lg">
                            <p className="text-sm font-medium mb-1">Décisions:</p>
                            <p className="text-sm whitespace-pre-wrap">{cr.decisions}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </ScrollArea>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-4 border-t">
          {onEdit && (
            <Button variant="outline" onClick={onEdit}>
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
          )}
          <Button
            onClick={handleDownloadPDF}
            disabled={downloading || pointsCRCount === 0}
          >
            <Download className="w-4 h-4 mr-2" />
            {downloading ? 'Téléchargement...' : 'Télécharger PDF'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
