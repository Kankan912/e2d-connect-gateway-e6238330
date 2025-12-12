import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit, Download, FileText, Calendar, Users, Clock, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';

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
  reunion: Reunion | null;
  onEdit?: () => void;
}

export default function CompteRenduViewer({ open, onOpenChange, reunion, onEdit }: CompteRenduViewerProps) {
  const [downloading, setDownloading] = useState(false);
  const { toast } = useToast();

  // Récupérer les points du compte-rendu
  const { data: comptesRendus, isLoading } = useQuery({
    queryKey: ['comptes-rendus', reunion?.id],
    queryFn: async () => {
      if (!reunion?.id) return [];
      const { data, error } = await supabase
        .from('rapports_seances')
        .select('*')
        .eq('reunion_id', reunion.id)
        .order('numero_ordre', { ascending: true });

      if (error) throw error;
      return data;
    },
    enabled: open && !!reunion?.id
  });

  // Récupérer les présences
  const { data: presences } = useQuery({
    queryKey: ['reunion-presences-full', reunion?.id],
    queryFn: async () => {
      if (!reunion?.id) return [];
      const { data, error } = await supabase
        .from('reunion_presences')
        .select(`
          present,
          excusee,
          retard,
          membres:membre_id (
            nom,
            prenom
          )
        `)
        .eq('reunion_id', reunion.id);

      if (error) throw error;
      return data;
    },
    enabled: open && !!reunion?.id
  });

  const handleDownloadPDF = async () => {
    if (!reunion?.id) return;
    setDownloading(true);
    
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const margin = 20;
      let yPosition = 20;

      // Titre principal
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('COMPTE-RENDU DE RÉUNION', pageWidth / 2, yPosition, { align: 'center' });
      yPosition += 15;

      // Ligne de séparation
      doc.setDrawColor(0, 100, 0);
      doc.setLineWidth(0.5);
      doc.line(margin, yPosition, pageWidth - margin, yPosition);
      yPosition += 10;

      // Informations de la réunion
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('INFORMATIONS GÉNÉRALES', margin, yPosition);
      yPosition += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      doc.text(`Sujet: ${reunion.sujet || 'Sans titre'}`, margin, yPosition);
      yPosition += 6;
      
      doc.text(`Date: ${format(new Date(reunion.date_reunion), 'PPP', { locale: fr })}`, margin, yPosition);
      yPosition += 6;
      
      if (reunion.lieu_description) {
        doc.text(`Lieu: ${reunion.lieu_description}`, margin, yPosition);
        yPosition += 6;
      }
      
      doc.text(`Statut: ${reunion.statut === 'terminee' ? 'Terminée' : reunion.statut}`, margin, yPosition);
      yPosition += 12;

      // Liste des présents
      const presents = presences?.filter((p: any) => p.present) || [];
      const absents = presences?.filter((p: any) => !p.present) || [];
      const excuses = presences?.filter((p: any) => p.excusee) || [];
      const retards = presences?.filter((p: any) => p.retard) || [];

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`PRÉSENCES (${presents.length} présent(s))`, margin, yPosition);
      yPosition += 8;

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      
      if (presents.length > 0) {
        const presentsText = presents
          .map((p: any) => `${p.membres?.prenom} ${p.membres?.nom}`)
          .join(', ');
        
        const presentsLines = doc.splitTextToSize(presentsText, pageWidth - 2 * margin);
        doc.text(presentsLines, margin, yPosition);
        yPosition += presentsLines.length * 5 + 5;
      } else {
        doc.text('Aucun présent enregistré', margin, yPosition);
        yPosition += 8;
      }

      if (excuses.length > 0) {
        doc.setFont('helvetica', 'italic');
        const excusesText = `Excusés: ${excuses.map((p: any) => `${p.membres?.prenom} ${p.membres?.nom}`).join(', ')}`;
        const excusesLines = doc.splitTextToSize(excusesText, pageWidth - 2 * margin);
        doc.text(excusesLines, margin, yPosition);
        yPosition += excusesLines.length * 5 + 5;
      }

      if (retards.length > 0) {
        doc.setFont('helvetica', 'italic');
        const retardsText = `Retards: ${retards.map((p: any) => `${p.membres?.prenom} ${p.membres?.nom}`).join(', ')}`;
        const retardsLines = doc.splitTextToSize(retardsText, pageWidth - 2 * margin);
        doc.text(retardsLines, margin, yPosition);
        yPosition += retardsLines.length * 5 + 5;
      }

      yPosition += 5;

      // Points à l'ordre du jour
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`ORDRE DU JOUR (${comptesRendus?.length || 0} point(s))`, margin, yPosition);
      yPosition += 10;

      if (comptesRendus && comptesRendus.length > 0) {
        comptesRendus.forEach((cr: any, index: number) => {
          // Vérifier si on a besoin d'une nouvelle page
          if (yPosition > 260) {
            doc.addPage();
            yPosition = 20;
          }

          doc.setFont('helvetica', 'bold');
          doc.setFontSize(11);
          doc.text(`${index + 1}. ${cr.sujet}`, margin, yPosition);
          yPosition += 6;

          if (cr.description) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            const descLines = doc.splitTextToSize(cr.description, pageWidth - 2 * margin - 10);
            doc.text(descLines, margin + 5, yPosition);
            yPosition += descLines.length * 5 + 3;
          }

          if (cr.resolution) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(0, 100, 0);
            doc.text('Résolution:', margin + 5, yPosition);
            yPosition += 5;
            doc.setTextColor(0, 0, 0);
            const resLines = doc.splitTextToSize(cr.resolution, pageWidth - 2 * margin - 15);
            doc.text(resLines, margin + 10, yPosition);
            yPosition += resLines.length * 5 + 3;
          }

          if (cr.decisions) {
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(10);
            doc.setTextColor(0, 0, 150);
            doc.text('Décisions:', margin + 5, yPosition);
            yPosition += 5;
            doc.setTextColor(0, 0, 0);
            const decLines = doc.splitTextToSize(cr.decisions, pageWidth - 2 * margin - 15);
            doc.text(decLines, margin + 10, yPosition);
            yPosition += decLines.length * 5 + 3;
          }

          yPosition += 5;
        });
      } else {
        doc.setFont('helvetica', 'italic');
        doc.setFontSize(10);
        doc.text('Aucun point à l\'ordre du jour', margin, yPosition);
      }

      // Pied de page
      const totalPages = doc.internal.pages.length - 1;
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'italic');
        doc.text(
          `Page ${i} sur ${totalPages} - Généré le ${format(new Date(), 'PPP à HH:mm', { locale: fr })}`,
          pageWidth / 2,
          290,
          { align: 'center' }
        );
      }

      // Télécharger le PDF
      const fileName = `CR_${reunion.sujet?.replace(/[^a-zA-Z0-9]/g, '_') || 'reunion'}_${format(new Date(reunion.date_reunion), 'yyyy-MM-dd')}.pdf`;
      doc.save(fileName);

      toast({
        title: "PDF téléchargé",
        description: `Le fichier ${fileName} a été téléchargé`,
      });
    } catch (error) {
      console.error('Erreur téléchargement PDF:', error);
      toast({
        title: "Erreur",
        description: "Impossible de générer le PDF",
        variant: "destructive",
      });
    } finally {
      setDownloading(false);
    }
  };

  const pointsCRCount = comptesRendus?.length || 0;
  const presentsCount = presences?.filter((p: any) => p.present).length || 0;

  if (!reunion) {
    return null;
  }

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
                    {presences?.filter((p: any) => p.present).map((presence: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted text-sm"
                      >
                        <span>
                          {presence.membres?.prenom} {presence.membres?.nom}
                        </span>
                        {presence.retard && (
                          <Badge variant="outline" className="text-xs">Retard</Badge>
                        )}
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
            {downloading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            {downloading ? 'Génération...' : 'Télécharger PDF'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
