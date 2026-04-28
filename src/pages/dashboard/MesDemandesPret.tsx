import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Loader2, HandCoins } from "lucide-react";
import { useMyLoanRequests, type LoanRequest, type LoanRequestStatus } from "@/hooks/useLoanRequests";
import { LoanRequestDialog } from "@/components/loans/LoanRequestDialog";
import { LoanValidationTimeline } from "@/components/loans/LoanValidationTimeline";
import { usePretRequestPermissions } from "@/hooks/usePretRequestPermissions";
import { format } from "date-fns";
import { fr } from "date-fns/locale";

const statusBadge = (s: LoanRequestStatus) => {
  switch (s) {
    case "pending":
      return <Badge variant="secondary">En attente</Badge>;
    case "in_progress":
      return <Badge className="bg-blue-500/15 text-blue-700 border-blue-500/30">En cours de validation</Badge>;
    case "approved":
      return <Badge className="bg-emerald-500/15 text-emerald-700 border-emerald-500/30">Approuvée</Badge>;
    case "rejected":
      return <Badge variant="destructive">Rejetée</Badge>;
    case "disbursed":
      return <Badge className="bg-violet-500/15 text-violet-700 border-violet-500/30">Décaissée</Badge>;
    default:
      return <Badge variant="outline">{s}</Badge>;
  }
};

const fmt = (n: number) => new Intl.NumberFormat("fr-FR").format(n) + " FCFA";

function LoanRequestCard({ r }: { r: LoanRequest }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <HandCoins className="h-4 w-4 text-primary" />
              {fmt(r.montant)} sur {r.duree_mois} mois
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              Demande du {format(new Date(r.created_at), "PPP", { locale: fr })}
              {r.urgence === "urgent" && (
                <Badge variant="destructive" className="ml-2 text-[10px]">URGENT</Badge>
              )}
            </p>
          </div>
          {statusBadge(r.statut)}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <p className="text-xs font-medium text-muted-foreground">Objet</p>
          <p className="text-sm">{r.description}</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Capacité de remboursement</p>
            <p>{r.capacite_remboursement}</p>
          </div>
          {r.garantie && (
            <div>
              <p className="text-xs font-medium text-muted-foreground">Garantie</p>
              <p>{r.garantie}</p>
            </div>
          )}
        </div>

        {r.statut === "rejected" && r.motif_rejet && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3">
            <p className="text-xs font-medium text-destructive">Motif du rejet</p>
            <p className="text-sm mt-1">{r.motif_rejet}</p>
          </div>
        )}

        <div>
          <p className="text-xs font-medium text-muted-foreground mb-2">Suivi de validation</p>
          <LoanValidationTimeline
            requestId={r.id}
            currentStep={r.current_step}
            globalStatus={r.statut}
          />
        </div>
      </CardContent>
    </Card>
  );
}

export default function MesDemandesPret() {
  const { data: requests, isLoading } = useMyLoanRequests();
  const { canCreate } = usePretRequestPermissions();
  const [dialogOpen, setDialogOpen] = useState(false);

  return (
    <div className="p-3 sm:p-6 space-y-4 max-w-4xl mx-auto">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold">Mes demandes de prêt</h1>
          <p className="text-sm text-muted-foreground">
            Suivez vos demandes en cours et leur statut de validation.
          </p>
        </div>
        {canCreate && (
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" /> Nouvelle demande
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Chargement...
        </div>
      ) : !requests || requests.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center text-muted-foreground">
            <HandCoins className="h-10 w-10 mx-auto mb-3 opacity-50" />
            <p>Aucune demande pour le moment.</p>
            {canCreate && (
              <Button className="mt-4" onClick={() => setDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" /> Créer ma première demande
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {requests.map((r) => (
            <LoanRequestCard key={r.id} r={r} />
          ))}
        </div>
      )}

      <LoanRequestDialog open={dialogOpen} onOpenChange={setDialogOpen} />
    </div>
  );
}
