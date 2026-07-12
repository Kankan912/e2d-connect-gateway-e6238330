import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock } from "lucide-react";
import { formatFCFA } from "@/lib/utils";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export interface ReconductionAttente {
  id: string;
  created_at: string;
  notes?: string | null;
  interet_mois?: number | null;
  prets?: {
    id?: string;
    montant?: number;
    reconductions?: number;
    membres?: { nom?: string; prenom?: string } | null;
  } | null;
}

interface Props {
  reconductions: ReconductionAttente[];
  isPending: boolean;
  onDecision: (reconId: string, decision: "validee" | "refusee") => void;
}

/**
 * Liste des demandes de reconduction de prêt en attente de validation.
 * Phase 5.5 — ajout d'un aperçu (capital + intérêt prorata) et confirmation
 * via AlertDialog (jamais window.confirm — conforme mémoire projet).
 */
export function ReconductionsAttenteList({ reconductions, isPending, onDecision }: Props) {
  const [pendingAction, setPendingAction] = useState<{
    id: string;
    decision: "validee" | "refusee";
    label: string;
  } | null>(null);

  if (reconductions.length === 0) return null;

  return (
    <>
      <Card className="border-amber-300 bg-amber-50 dark:bg-amber-950/20">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2 text-amber-800 dark:text-amber-300">
            <Clock className="h-4 w-4" />
            {reconductions.length} reconduction(s) en attente de validation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {reconductions.map((r) => {
            const membre = `${r.prets?.membres?.prenom ?? ""} ${r.prets?.membres?.nom ?? ""}`.trim() || "Membre";
            const interet = Number(r.interet_mois || 0);
            const capital = Number(r.prets?.montant || 0);
            return (
              <div
                key={r.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded border bg-background"
              >
                <div className="text-sm space-y-0.5">
                  <div className="font-medium">{membre}</div>
                  <div className="text-xs text-muted-foreground">
                    Capital {formatFCFA(capital)} · Intérêt prorata {formatFCFA(interet)}
                    {r.prets?.reconductions != null && (
                      <> · Reconduction n°{(r.prets.reconductions ?? 0) + 1}</>
                    )}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    Demande du {new Date(r.created_at).toLocaleDateString("fr-FR")}
                    {r.notes ? ` — ${r.notes}` : ""}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setPendingAction({ id: r.id, decision: "refusee", label: membre })}
                    disabled={isPending}
                    aria-label="Refuser la reconduction"
                  >
                    Refuser
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => setPendingAction({ id: r.id, decision: "validee", label: membre })}
                    disabled={isPending}
                    aria-label="Valider la reconduction"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" /> Valider
                  </Button>
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <AlertDialog open={!!pendingAction} onOpenChange={(open) => !open && setPendingAction(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {pendingAction?.decision === "validee" ? "Valider la reconduction ?" : "Refuser la reconduction ?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingAction?.decision === "validee"
                ? `Le prêt de ${pendingAction?.label} sera reconduit avec l'intérêt prorata calculé. Cette action met à jour le statut et enverra la notification correspondante.`
                : `La demande de reconduction de ${pendingAction?.label} sera rejetée. Le membre en sera informé.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (pendingAction) {
                  onDecision(pendingAction.id, pendingAction.decision);
                  setPendingAction(null);
                }
              }}
            >
              Confirmer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
