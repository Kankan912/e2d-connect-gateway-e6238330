import { useState, useMemo } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Mail, Loader2, Users, FileText, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";

import { logger } from "@/lib/logger";
interface NotifierReunionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reunionId: string;
  reunionData: { sujet?: string; date_reunion: string; ordre_du_jour?: string; lieu_description?: string };
}

type RecipientType = "tous" | "presents" | "absents";

export default function NotifierReunionModal({
  open,
  onOpenChange,
  reunionId,
  reunionData,
}: NotifierReunionModalProps) {
  const [sending, setSending] = useState(false);
  const [recipientType, setRecipientType] = useState<RecipientType>("tous");
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

  // Tous les membres actifs de l'association (diffusion élargie)
  const { data: tousMembres } = useQuery({
    queryKey: ["membres-actifs-notifier"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membres")
        .select("id, nom, prenom, email")
        .eq("statut", "actif")
        .order("nom");
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

  // Calculer les destinataires selon le type sélectionné
  const destinataires = useMemo(() => {
    if (recipientType === "tous") {
      return (tousMembres || [])
        .filter(m => m.email)
        .map(m => ({ email: m.email!, nom: m.nom, prenom: m.prenom }));
    }

    if (!presences) return [];

    const filtered =
      recipientType === "presents"
        ? presences.filter(p => p.statut_presence === "present")
        : presences.filter(
            p => p.statut_presence === "absent_non_excuse" || p.statut_presence === "excuse",
          );

    return filtered
      .filter(p => p.membre?.email)
      .map(p => ({
        email: p.membre!.email!,
        nom: p.membre!.nom,
        prenom: p.membre!.prenom,
      }));
  }, [presences, tousMembres, recipientType]);

  // Membres avec email pour sélection manuelle
  const membresAvecEmail = (tousMembres || [])
    .filter(m => m.email)
    .map(m => ({ membre: m }));


  const tauxPresence = presences && presences.length > 0 
    ? Math.round((presents.length / presences.length) * 100) 
    : 0;

  const handleSendNotification = async () => {
    if (destinataires.length === 0) {
      toast({
        title: "Aucun destinataire",
        description: "Aucun membre correspondant aux critères avec email",
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
          cible: recipientType,
          sujet: `[APERÇU] ${reunionData.ordre_du_jour || "Réunion E2D"}`,
          contenu,
          dateReunion: new Date(reunionData.date_reunion).toLocaleDateString("fr-FR", {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric",
          }),
          heure: new Date(reunionData.date_reunion).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
          lieu: reunionData.lieu_description,
          ordreDuJour: reunionData.ordre_du_jour,

          presences: presenceInfo,
          isPreview: true,
        },
      });

      if (error) {
        const errorMessage = data?.error || error.message;
        throw new Error(errorMessage);
      }
      if (data?.error) throw new Error(data.error);

      toast({
        title: "Notification envoyée",
        description: `${data.sentCount} email(s) envoyé(s) (aperçu, sans clôture)`,
      });

      onOpenChange(false);
    } catch (error: unknown) {
      logger.error("Erreur envoi notification:", error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Impossible d'envoyer la notification",
        variant: "destructive",
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            Notifier sans clôturer
          </DialogTitle>
          <DialogDescription>
            Envoyer un compte-rendu préliminaire aux membres sélectionnés
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

          {/* Sélection type de destinataires */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">Destinataires</Label>
            <RadioGroup 
              value={recipientType} 
              onValueChange={(v) => setRecipientType(v as RecipientType)}
              className="grid grid-cols-2 gap-2"
            >
              <div className="flex items-center space-x-2 border rounded-lg p-2">
                <RadioGroupItem value="tous" id="tous" />
                <Label htmlFor="tous" className="font-normal text-sm cursor-pointer">
                  Tous ({membresAvecEmail.length})
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-2">
                <RadioGroupItem value="presents" id="presents" />
                <Label htmlFor="presents" className="font-normal text-sm cursor-pointer">
                  Présents ({presents.filter(p => p.membre?.email).length})
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-lg p-2">
                <RadioGroupItem value="absents" id="absents" />
                <Label htmlFor="absents" className="font-normal text-sm cursor-pointer">
                  Absents/Excusés ({[...excuses, ...absents].filter(p => p.membre?.email).length})
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Affichage des destinataires */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4" />
              <span>Destinataires ({destinataires.length}) — liste calculée côté serveur</span>
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
                <span>Aucun destinataire sélectionné avec email</span>
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
