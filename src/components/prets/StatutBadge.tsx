/**
 * StatutBadge — badge de statut prêt unifié (Phase 5.2).
 *
 * Source unique de vérité pour l'affichage des statuts de prêt calculés par
 * `LoanService.resolveStatus`. Toute nouvelle vue prêt doit passer par ce
 * composant plutôt que de dupliquer un `switch` sur `statut`.
 */
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock, RefreshCw, Ban } from "lucide-react";
import type { LoanStatut } from "@/domain/finance/types";

interface Props {
  statut: LoanStatut | string;
  className?: string;
}

export function StatutBadge({ statut, className }: Props) {
  switch (statut) {
    case "en_cours":
      return (
        <Badge variant="secondary" className={`bg-blue-100 text-blue-800 ${className ?? ""}`}>
          <Clock className="h-3 w-3 mr-1" /> En cours
        </Badge>
      );
    case "rembourse":
      return (
        <Badge className={`bg-green-500 ${className ?? ""}`}>
          <CheckCircle className="h-3 w-3 mr-1" /> Remboursé
        </Badge>
      );
    case "partiel":
      return (
        <Badge className={`bg-orange-500 ${className ?? ""}`}>
          <AlertTriangle className="h-3 w-3 mr-1" /> Partiel
        </Badge>
      );
    case "en_retard":
      return (
        <Badge variant="destructive" className={className}>
          <AlertTriangle className="h-3 w-3 mr-1" /> En retard
        </Badge>
      );
    case "reconduit":
      return (
        <Badge className={`bg-blue-500 ${className ?? ""}`}>
          <RefreshCw className="h-3 w-3 mr-1" /> Reconduit
        </Badge>
      );
    case "annule":
      return (
        <Badge variant="outline" className={className}>
          <Ban className="h-3 w-3 mr-1" /> Annulé
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className={className}>
          {statut}
        </Badge>
      );
  }
}
