import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Edit, Download, FileText, Calendar, Users, Clock, Loader2, AlertTriangle, Coins, PiggyBank, HandHeart, Gift } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import jsPDF from 'jspdf';
import { addE2DLogo, addE2DFooter } from '@/lib/pdf-utils';

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

  // Récupérer les présences depuis reunions_presences
  const { data: presences } = useQuery({
    queryKey: ['reunion-presences-full', reunion?.id],
    queryFn: async () => {
      if (!reunion?.id) return [];
      const { data, error } = await supabase
        .from('reunions_presences')
        .select(`
          statut_presence,
          heure_arrivee,
          observations,
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

  // Récupérer les sanctions de la réunion
  const { data: sanctionsReunion } = useQuery({
    queryKey: ['reunion-sanctions-cr', reunion?.id],
    queryFn: async () => {
      if (!reunion?.id) return [];
      const { data, error } = await supabase
        .from('reunions_sanctions')
        .select('*, membre:membre_id(nom, prenom)')
        .eq('reunion_id', reunion.id);
      if (error) throw error;
      return data;
    },
    enabled: open && !!reunion?.id
  });

  // Récupérer les cotisations collectées
  const { data: cotisationsReunion } = useQuery({
    queryKey: ['reunion-cotisations-cr', reunion?.id],
    queryFn: async () => {
      if (!reunion?.id) return [];
      const { data, error } = await supabase
        .from('cotisations')
        .select('*, membre:membre_id(nom, prenom), type:type_cotisation_id(nom)')
        .eq('reunion_id', reunion.id);
      if (error) throw error;
      return data;
    },
    enabled: open && !!reunion?.id
  });

  // Récupérer les épargnes déposées
  const { data: epargnesReunion } = useQuery({
    queryKey: ['reunion-epargnes-cr', reunion?.id],
    queryFn: async () => {
      if (!reunion?.id) return [];
      const { data, error } = await supabase
        .from('epargnes')
        .select('*, membre:membre_id(nom, prenom)')
        .eq('reunion_id', reunion.id);
      if (error) throw error;
      return data;
    },
    enabled: open && !!reunion?.id
  });

  // Récupérer les aides distribuées (par date de la réunion)
  const { data: aidesReunion } = useQuery({
    queryKey: ['reunion-aides-cr', reunion?.id, reunion?.date_reunion],
    queryFn: async () => {
      if (!reunion?.id || !reunion?.date_reunion) return [];
      const { data, error } = await supabase
        .from('aides')
        .select('*, beneficiaire:beneficiaire_id(nom, prenom), type:type_aide_id(nom)')
        .eq('date_allocation', reunion.date_reunion);
      if (error) throw error;
      return data;
    },
    enabled: open && !!reunion?.id
  });

  // Récupérer les bénéficiaires de la réunion
  const { data: beneficiairesReunion } = useQuery({
    queryKey: ['reunion-beneficiaires-cr', reunion?.id],
    queryFn: async () => {
      if (!reunion?.id) return [];
      const { data, error } = await supabase
        .from('reunion_beneficiaires')
        .select('*, membres:membre_id(nom, prenom)')
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

      // Ajouter le logo E2D en haut à droite
      await addE2DLogo(doc);

      const checkNewPage = (neededSpace: number = 30) => {
        if (yPosition > 260 - neededSpace) {
          doc.addPage();
          yPosition = 20;
        }
      };

      // Titre principal
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text('COMPTE-RENDU DE RÉUNION', margin, yPosition);
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

      // Liste des présents, excusés, absents non excusés
      const presents = presences?.filter((p: any) => p.statut_presence === 'present') || [];
      const excuses = presences?.filter((p: any) => p.statut_presence === 'absent_excuse') || [];
      const absentsNonExcuses = presences?.filter((p: any) => p.statut_presence === 'absent_non_excuse') || [];
      const retards = presences?.filter((p: any) => p.heure_arrivee) || [];
      const totalMembres = presents.length + excuses.length + absentsNonExcuses.length;
      const tauxPresence = totalMembres > 0 ? Math.round((presents.length / totalMembres) * 100) : 0;

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`PRÉSENCES - Taux: ${tauxPresence}%`, margin, yPosition);
      yPosition += 8;
      
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.text(`Présents: ${presents.length} | Excusés: ${excuses.length} | Absents non excusés: ${absentsNonExcuses.length}`, margin, yPosition);
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

      // Absents non excusés (en rouge)
      if (absentsNonExcuses.length > 0) {
        doc.setFont('helvetica', 'italic');
        doc.setTextColor(200, 0, 0); // Rouge
        const absentsText = `Absents non excusés: ${absentsNonExcuses.map((p: any) => `${p.membres?.prenom} ${p.membres?.nom}`).join(', ')}`;
        const absentsLines = doc.splitTextToSize(absentsText, pageWidth - 2 * margin);
        doc.text(absentsLines, margin, yPosition);
        yPosition += absentsLines.length * 5 + 5;
        doc.setTextColor(0, 0, 0); // Reset couleur
      }

      yPosition += 5;

      // Points à l'ordre du jour
      checkNewPage();
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.text(`ORDRE DU JOUR (${comptesRendus?.length || 0} point(s))`, margin, yPosition);
      yPosition += 10;

      if (comptesRendus && comptesRendus.length > 0) {
        comptesRendus.forEach((cr: any, index: number) => {
          checkNewPage();

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
        yPosition += 10;
      }

      // === SECTION COTISATIONS ===
      if (cotisationsReunion && cotisationsReunion.length > 0) {
        checkNewPage();
        const totalCotisations = cotisationsReunion.reduce((sum: number, c: any) => sum + (c.montant || 0), 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(`COTISATIONS COLLECTÉES (${cotisationsReunion.length}) - Total: ${totalCotisations.toLocaleString()} FCFA`, margin, yPosition);
        yPosition += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        cotisationsReunion.forEach((c: any) => {
          checkNewPage(10);
          doc.text(`• ${c.membre?.prenom} ${c.membre?.nom} - ${c.type?.nom || 'Type inconnu'}: ${c.montant?.toLocaleString()} FCFA`, margin + 5, yPosition);
          yPosition += 5;
        });
        yPosition += 5;
      }

      // === SECTION ÉPARGNES ===
      if (epargnesReunion && epargnesReunion.length > 0) {
        checkNewPage();
        const totalEpargnes = epargnesReunion.reduce((sum: number, e: any) => sum + (e.montant || 0), 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(`ÉPARGNES DÉPOSÉES (${epargnesReunion.length}) - Total: ${totalEpargnes.toLocaleString()} FCFA`, margin, yPosition);
        yPosition += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        epargnesReunion.forEach((e: any) => {
          checkNewPage(10);
          doc.text(`• ${e.membre?.prenom} ${e.membre?.nom}: ${e.montant?.toLocaleString()} FCFA`, margin + 5, yPosition);
          yPosition += 5;
        });
        yPosition += 5;
      }

      // === SECTION SANCTIONS ===
      if (sanctionsReunion && sanctionsReunion.length > 0) {
        checkNewPage();
        const totalSanctions = sanctionsReunion.reduce((sum: number, s: any) => sum + (s.montant_amende || 0), 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(`SANCTIONS (${sanctionsReunion.length}) - Total: ${totalSanctions.toLocaleString()} FCFA`, margin, yPosition);
        yPosition += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        sanctionsReunion.forEach((s: any) => {
          checkNewPage(10);
          const statut = s.statut === 'paye' ? '✓' : '○';
          doc.text(`${statut} ${s.membre?.prenom} ${s.membre?.nom} - ${s.motif || 'Sanction'}: ${s.montant_amende?.toLocaleString()} FCFA`, margin + 5, yPosition);
          yPosition += 5;
        });
        yPosition += 5;
      }

      // === SECTION AIDES ===
      if (aidesReunion && aidesReunion.length > 0) {
        checkNewPage();
        const totalAides = aidesReunion.reduce((sum: number, a: any) => sum + (a.montant || 0), 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(`AIDES DISTRIBUÉES (${aidesReunion.length}) - Total: ${totalAides.toLocaleString()} FCFA`, margin, yPosition);
        yPosition += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        aidesReunion.forEach((a: any) => {
          checkNewPage(10);
          doc.text(`• ${a.beneficiaire?.prenom} ${a.beneficiaire?.nom} - ${a.type?.nom || 'Aide'}: ${a.montant?.toLocaleString()} FCFA`, margin + 5, yPosition);
          yPosition += 5;
        });
        yPosition += 5;
      }

      // === SECTION BÉNÉFICIAIRES ===
      if (beneficiairesReunion && beneficiairesReunion.length > 0) {
        checkNewPage();
        const totalBeneficiaires = beneficiairesReunion.reduce((sum: number, b: any) => sum + (b.montant_final || 0), 0);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(`BÉNÉFICIAIRES DU MOIS (${beneficiairesReunion.length}) - Total: ${totalBeneficiaires.toLocaleString()} FCFA`, margin, yPosition);
        yPosition += 8;

        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        beneficiairesReunion.forEach((b: any) => {
          checkNewPage(10);
          const statut = b.statut === 'paye' ? '✓' : '○';
          const details = b.deductions && Object.keys(b.deductions).length > 0
            ? ` (Brut: ${(b.montant_brut || 0).toLocaleString()}, Déductions: -${Object.values(b.deductions as Record<string, number>).reduce((a, c) => a + c, 0).toLocaleString()})`
            : '';
          doc.text(`${statut} ${b.membres?.prenom} ${b.membres?.nom}: ${(b.montant_final || 0).toLocaleString()} FCFA${details}`, margin + 5, yPosition);
          yPosition += 5;
        });
        yPosition += 5;
      }

      // Pied de page avec logo E2D
      addE2DFooter(doc);

      // Télécharger le PDF
      const fileName = `CR_${(reunion.sujet ?? 'reunion').replace(/[^a-zA-Z0-9]/g, '_')}_${format(new Date(reunion.date_reunion), 'yyyy-MM-dd')}.pdf`;
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
  const presentsCount = presences?.filter((p: any) => p.statut_presence === 'present').length || 0;
  const excusesCount = presences?.filter((p: any) => p.statut_presence === 'absent_excuse').length || 0;
  const absentsNonExcusesCount = presences?.filter((p: any) => p.statut_presence === 'absent_non_excuse').length || 0;
  const sanctionsCount = sanctionsReunion?.length || 0;
  const cotisationsCount = cotisationsReunion?.length || 0;
  const epargnesCount = epargnesReunion?.length || 0;
  const aidesCount = aidesReunion?.length || 0;
  const beneficiairesCount = beneficiairesReunion?.length || 0;
  
  const totalMembresPresence = presentsCount + excusesCount + absentsNonExcusesCount;
  const tauxPresenceCalcule = totalMembresPresence > 0 ? Math.round((presentsCount / totalMembresPresence) * 100) : 0;

  const totalCotisations = cotisationsReunion?.reduce((sum: number, c: any) => sum + (c.montant || 0), 0) || 0;
  const totalEpargnes = epargnesReunion?.reduce((sum: number, e: any) => sum + (e.montant || 0), 0) || 0;
  const totalSanctions = sanctionsReunion?.reduce((sum: number, s: any) => sum + (s.montant_amende || 0), 0) || 0;
  const totalAides = aidesReunion?.reduce((sum: number, a: any) => sum + (a.montant || 0), 0) || 0;
  const totalBeneficiaires = beneficiairesReunion?.reduce((sum: number, b: any) => sum + (b.montant_final || 0), 0) || 0;

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
            Consultation du compte-rendu complet
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
                  <span className="font-medium">Taux de présence:</span>
                  <Badge variant={tauxPresenceCalcule >= 75 ? 'default' : tauxPresenceCalcule >= 50 ? 'secondary' : 'destructive'}>
                    {tauxPresenceCalcule}%
                  </Badge>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Présents:</span>
                    <Badge variant="outline" className="bg-green-50 dark:bg-green-950">{presentsCount}</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Excusés:</span>
                    <Badge variant="outline" className="bg-orange-50 dark:bg-orange-950">{excusesCount}</Badge>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-muted-foreground">Absents:</span>
                    <Badge variant="destructive">{absentsNonExcusesCount}</Badge>
                  </div>
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
                    {presences?.filter((p: any) => p.statut_presence === 'present').map((presence: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 rounded-lg bg-muted text-sm"
                      >
                        <span>
                          {presence.membres?.prenom} {presence.membres?.nom}
                        </span>
                        {presence.heure_arrivee && (
                          <Badge variant="outline" className="text-xs">Arrivée: {presence.heure_arrivee}</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Absents non excusés */}
            {absentsNonExcusesCount > 0 && (
              <Card className="border-destructive/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2 text-destructive">
                    <AlertTriangle className="h-4 w-4" />
                    Absents Non Excusés ({absentsNonExcusesCount})
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {presences?.filter((p: any) => p.statut_presence === 'absent_non_excuse').map((presence: any, index: number) => (
                      <div
                        key={index}
                        className="flex items-center gap-2 p-2 rounded-lg bg-destructive/10 text-sm"
                      >
                        <span className="text-destructive">
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

            {/* Cotisations collectées */}
            {cotisationsCount > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Coins className="h-4 w-4" />
                    Cotisations Collectées ({cotisationsCount})
                    <Badge variant="secondary" className="ml-auto">{totalCotisations.toLocaleString()} FCFA</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {cotisationsReunion?.map((c: any) => (
                      <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-muted text-sm">
                        <span>{c.membre?.prenom} {c.membre?.nom}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{c.type?.nom || 'Type inconnu'}</Badge>
                          <span className="font-medium">{c.montant?.toLocaleString()} FCFA</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Épargnes déposées */}
            {epargnesCount > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <PiggyBank className="h-4 w-4" />
                    Épargnes Déposées ({epargnesCount})
                    <Badge variant="secondary" className="ml-auto">{totalEpargnes.toLocaleString()} FCFA</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {epargnesReunion?.map((e: any) => (
                      <div key={e.id} className="flex items-center justify-between p-2 rounded-lg bg-muted text-sm">
                        <span>{e.membre?.prenom} {e.membre?.nom}</span>
                        <span className="font-medium">{e.montant?.toLocaleString()} FCFA</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Sanctions */}
            {sanctionsCount > 0 && (
              <Card className="border-orange-200 dark:border-orange-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-orange-500" />
                    Sanctions ({sanctionsCount})
                    <Badge variant="destructive" className="ml-auto">{totalSanctions.toLocaleString()} FCFA</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {sanctionsReunion?.map((s: any) => (
                      <div key={s.id} className="flex items-center justify-between p-2 rounded-lg bg-muted text-sm">
                        <div className="flex items-center gap-2">
                          <span>{s.membre?.prenom} {s.membre?.nom}</span>
                          <span className="text-muted-foreground">- {s.motif || 'Sanction'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={s.statut === 'paye' ? 'default' : 'outline'}>
                            {s.statut === 'paye' ? 'Payé' : 'Impayé'}
                          </Badge>
                          <span className="font-medium">{s.montant_amende?.toLocaleString()} FCFA</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Aides distribuées */}
            {aidesCount > 0 && (
              <Card className="border-green-200 dark:border-green-800">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <HandHeart className="h-4 w-4 text-green-500" />
                    Aides Distribuées ({aidesCount})
                    <Badge className="ml-auto bg-green-600">{totalAides.toLocaleString()} FCFA</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {aidesReunion?.map((a: any) => (
                      <div key={a.id} className="flex items-center justify-between p-2 rounded-lg bg-muted text-sm">
                        <div className="flex items-center gap-2">
                          <span>{a.beneficiaire?.prenom} {a.beneficiaire?.nom}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{a.type?.nom || 'Aide'}</Badge>
                          <span className="font-medium">{a.montant?.toLocaleString()} FCFA</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Bénéficiaires du mois */}
            {beneficiairesCount > 0 && (
              <Card className="border-primary/50">
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Gift className="h-4 w-4 text-primary" />
                    Bénéficiaires du Mois ({beneficiairesCount})
                    <Badge className="ml-auto bg-primary">{totalBeneficiaires.toLocaleString()} FCFA</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {beneficiairesReunion?.map((b: any) => (
                      <div key={b.id} className="flex items-center justify-between p-2 rounded-lg bg-muted text-sm">
                        <div className="flex items-center gap-2">
                          <span>{b.membres?.prenom} {b.membres?.nom}</span>
                          {b.deductions && Object.keys(b.deductions).length > 0 && (
                            <span className="text-xs text-muted-foreground">
                              (Déductions: -{Object.values(b.deductions as Record<string, number>).reduce((a, c) => a + c, 0).toLocaleString()})
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={b.statut === 'paye' ? 'default' : 'outline'}>
                            {b.statut === 'paye' ? 'Payé' : 'Impayé'}
                          </Badge>
                          <span className="font-medium">{(b.montant_final || 0).toLocaleString()} FCFA</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
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
