import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Loader2, Users, FileText, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

interface NotifierReunionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reunionId: string;
  reunionData: { sujet?: string; date_reunion: string; ordre_du_jour?: string; lieu_description?: string };
}

export default function NotifierReunionModal({
  open,
  onOpenChange,
  reunionId,
  reunionData,
}: NotifierReunionModalProps) {
  const [sending, setSending] = useState(false);
  const { toast } = useToast();

  // Récupérer les membres présents
  const { data: presences } = useQuery({
    queryKey: ["presences-notifier", reunionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reunions_presences")
        .select(`
          id,
          statut_presence,
          heure_arrivee,
          membre:membres(id, nom, prenom, email)
        `)
        .eq("reunion_id", reunionId);
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Récupérer les comptes-rendus
  const { data: comptesRendus } = useQuery({
    queryKey: ["comptes-rendus-notifier", reunionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("rapports_seances")
        .select("id, sujet, resolution, description")
        .eq("reunion_id", reunionId)
        .order("numero_ordre", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  // Calculer les statistiques
  const presents = presences?.filter(p => p.statut_presence === "present") || [];
  const excuses = presences?.filter(p => p.statut_presence === "excuse") || [];
  const absents = presences?.filter(p => p.statut_presence === "absent_non_excuse") || [];
  const retards = presences?.filter(p => p.heure_arrivee) || [];

  const destinataires = presences
    ?.filter(p => p.membre?.email && p.statut_presence === "present")
    .map(p => ({
      email: p.membre!.email!,
      nom: p.membre!.nom,
      prenom: p.membre!.prenom,
    })) || [];

  const tauxPresence = presences && presences.length > 0 
    ? Math.round((presents.length / presences.length) * 100) 
    : 0;

  const handleSendNotification = async () => {
    if (destinataires.length === 0) {
      toast({
        title: "Aucun destinataire",
        description: "Aucun membre présent avec email trouvé",
        variant: "destructive",
      });
      return;
    }

    setSending(true);
    try {
      // Construire le contenu du CR
      const contenu = comptesRendus?.map(cr => {
        const content = cr.resolution || cr.description || "Pas de détails";
        return `## ${cr.sujet}\n${content}`;
      }).join("\n\n") || "Aucun compte-rendu disponible.";

      const presenceInfo = {
        presents: presents.map(p => `${p.membre?.prenom} ${p.membre?.nom}`),
        excuses: excuses.map(p => `${p.membre?.prenom} ${p.membre?.nom}`),
        absentsNonExcuses: absents.map(p => `${p.membre?.prenom} ${p.membre?.nom}`),
        retards: retards.map(p => `${p.membre?.prenom} ${p.membre?.nom}`),
        tauxPresence,
      };

      const { data, error } = await supabase.functions.invoke("send-reunion-cr", {
        body: {
          reunionId,
          destinataires,
          sujet: `[APERÇU] ${reunionData.ordre_du_jour || "Réunion E2D"}`,
          contenu,
          dateReunion: new Date(reunionData.date_reunion).toLocaleDateString("fr-FR"),
          lieu: reunionData.lieu_description,
          presences: presenceInfo,
          isPreview: true,
        },
      });

      if (error) throw error;

      toast({
        title: "Notification envoyée",
        description: `${data.sentCount} email(s) envoyé(s) (aperçu, sans clôture)`,
      });

      onOpenChange(false);
    } catch (error: any) {
      console.error("Erreur envoi notification:", error);
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'envoyer la notification",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Notifier sans clôturer
          </DialogTitle>
          <DialogDescription>
            Envoyer un compte-rendu préliminaire aux membres présents
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Infos réunion */}
          <Card>
            <CardContent className="pt-4">
              <div className="text-sm space-y-1">
                <p><strong>Date :</strong> {new Date(reunionData.date_reunion).toLocaleDateString("fr-FR")}</p>
                <p><strong>Sujet :</strong> {reunionData.ordre_du_jour || "Non défini"}</p>
                {reunionData.lieu_description && (
                  <p><strong>Lieu :</strong> {reunionData.lieu_description}</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Statistiques présences */}
          <div className="grid grid-cols-4 gap-2">
            <div className="text-center p-2 bg-success/10 rounded-lg">
              <p className="text-lg font-bold text-success">{presents.length}</p>
              <p className="text-xs text-muted-foreground">Présents</p>
            </div>
            <div className="text-center p-2 bg-secondary/10 rounded-lg">
              <p className="text-lg font-bold text-secondary">{excuses.length}</p>
              <p className="text-xs text-muted-foreground">Excusés</p>
            </div>
            <div className="text-center p-2 bg-destructive/10 rounded-lg">
              <p className="text-lg font-bold text-destructive">{absents.length}</p>
              <p className="text-xs text-muted-foreground">Absents</p>
            </div>
            <div className="text-center p-2 bg-primary/10 rounded-lg">
              <p className="text-lg font-bold text-primary">{tauxPresence}%</p>
              <p className="text-xs text-muted-foreground">Taux</p>
            </div>
          </div>

          {/* Points de CR */}
          <div className="flex items-center gap-2 text-sm">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span>{comptesRendus?.length || 0} point(s) de compte-rendu</span>
          </div>

          {/* Destinataires */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4" />
              <span>Destinataires ({destinataires.length})</span>
            </div>
            {destinataires.length > 0 ? (
              <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                {destinataires.map((d, i) => (
                  <Badge key={i} variant="secondary" className="text-xs">
                    {d.prenom} {d.nom}
                  </Badge>
                ))}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                <span>Aucun membre présent avec email</span>
              </div>
            )}
          </div>

          {/* Avertissement */}
          <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
            <strong>Note :</strong> Cette notification est un aperçu. L'email portera la mention [APERÇU] 
            et la réunion restera modifiable. Pour finaliser, utilisez la fonction "Clôturer".
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={sending}>
            Annuler
          </Button>
          <Button 
            onClick={handleSendNotification} 
            disabled={sending || destinataires.length === 0}
          >
            {sending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Mail className="w-4 h-4 mr-2" />
                Envoyer l'aperçu
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
