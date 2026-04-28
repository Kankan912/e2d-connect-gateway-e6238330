import { useLoanRequestValidations, type LoanRequestValidation } from "@/hooks/useLoanRequests";
import { CheckCircle2, XCircle, Clock, CircleDot } from "lucide-react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Props {
  requestId: string;
  currentStep: number;
  globalStatus: string;
}

function StepIcon({ statut, isCurrent }: { statut: LoanRequestValidation["statut"]; isCurrent: boolean }) {
  if (statut === "approved") return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
  if (statut === "rejected") return <XCircle className="h-5 w-5 text-destructive" />;
  if (isCurrent) return <CircleDot className="h-5 w-5 text-blue-600 animate-pulse" />;
  return <Clock className="h-5 w-5 text-muted-foreground" />;
}

export function LoanValidationTimeline({ requestId, currentStep, globalStatus }: Props) {
  const { data: steps, isLoading } = useLoanRequestValidations(requestId);

  if (isLoading) return <p className="text-sm text-muted-foreground">Chargement…</p>;
  if (!steps || steps.length === 0) return <p className="text-sm text-muted-foreground">Aucune étape configurée.</p>;

  return (
    <ol className="space-y-3">
      {steps.map((s) => {
        const isCurrent = globalStatus === "in_progress" && s.ordre === currentStep && s.statut === "pending";
        const colorClass =
          s.statut === "approved"
            ? "border-emerald-500/50 bg-emerald-500/5"
            : s.statut === "rejected"
            ? "border-destructive/50 bg-destructive/5"
            : isCurrent
            ? "border-blue-500/50 bg-blue-500/5"
            : "border-muted bg-muted/20";

        return (
          <li
            key={s.id}
            className={cn("flex items-start gap-3 rounded-md border p-3", colorClass)}
          >
            <div className="mt-0.5">
              <StepIcon statut={s.statut} isCurrent={isCurrent} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="font-medium">
                  Étape {s.ordre} — {s.label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {s.statut === "approved" && "Validé"}
                  {s.statut === "rejected" && "Rejeté"}
                  {s.statut === "pending" && (isCurrent ? "En cours" : "En attente")}
                </span>
              </div>
              {s.commentaire && (
                <p className="text-sm text-muted-foreground mt-1 italic">« {s.commentaire} »</p>
              )}
              {s.validated_at && (
                <p className="text-xs text-muted-foreground mt-1">
                  {format(new Date(s.validated_at), "PPp", { locale: fr })}
                </p>
              )}
            </div>
          </li>
        );
      })}
    </ol>
  );
}
