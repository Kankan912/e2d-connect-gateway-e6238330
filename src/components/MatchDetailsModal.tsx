import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Trophy, Calendar, MapPin, Users } from "lucide-react";

interface MatchDetailsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  match: any;
  matchType: "e2d" | "phoenix";
}

export default function MatchDetailsModal({ open, onOpenChange, match, matchType }: MatchDetailsModalProps) {
  if (!match) return null;

  const resultat = match.buts_marques > match.buts_encaisses ? "Victoire" : match.buts_marques < match.buts_encaisses ? "Défaite" : "Match nul";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Trophy className="h-5 w-5" />Détails du Match</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center gap-8">
                <div className="text-center"><p className="text-sm text-muted-foreground mb-2">{matchType === "e2d" ? "E2D" : "Phoenix"}</p><p className="text-4xl font-bold">{match.buts_marques}</p></div>
                <div className="text-2xl font-bold text-muted-foreground">-</div>
                <div className="text-center"><p className="text-sm text-muted-foreground mb-2">{match.adversaire}</p><p className="text-4xl font-bold">{match.buts_encaisses}</p></div>
              </div>
              <div className="text-center mt-4"><Badge variant={resultat === "Victoire" ? "default" : resultat === "Défaite" ? "destructive" : "outline"}>{resultat}</Badge></div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base">Informations</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center gap-2 text-sm"><Calendar className="h-4 w-4 text-muted-foreground" /><span className="font-medium">Date:</span><span>{new Date(match.date_match).toLocaleDateString("fr-FR")}</span></div>
              <Separator />
              <div className="flex items-center gap-2 text-sm"><MapPin className="h-4 w-4 text-muted-foreground" /><span className="font-medium">Lieu:</span><Badge variant="outline">{match.lieu === "domicile" ? "Domicile" : "Extérieur"}</Badge></div>
              {match.competition && (<><Separator /><div className="flex items-center gap-2 text-sm"><Trophy className="h-4 w-4 text-muted-foreground" /><span className="font-medium">Compétition:</span><span>{match.competition}</span></div></>)}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4" />Statistiques</CardTitle></CardHeader>
            <CardContent><p className="text-sm text-muted-foreground">Statistiques détaillées à venir...</p></CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
