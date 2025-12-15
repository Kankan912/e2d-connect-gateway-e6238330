import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  Wallet, 
  PiggyBank, 
  Receipt, 
  AlertTriangle, 
  HandCoins, 
  TrendingUp,
  Users,
  Trophy,
  Banknote,
  RefreshCw
} from "lucide-react";
import { useCaisseSynthese } from "@/hooks/useCaisseSynthese";

const formatMontant = (montant: number) =>
  new Intl.NumberFormat("fr-FR").format(montant) + " FCFA";

interface SynthWidgetProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info";
  subtitle?: string;
}

const SynthWidget = ({ title, value, icon, variant = "default", subtitle }: SynthWidgetProps) => {
  const variantStyles = {
    default: "border-border bg-card",
    success: "border-emerald-200 bg-emerald-50 dark:bg-emerald-950/30",
    warning: "border-amber-200 bg-amber-50 dark:bg-amber-950/30",
    danger: "border-red-200 bg-red-50 dark:bg-red-950/30",
    info: "border-blue-200 bg-blue-50 dark:bg-blue-950/30",
  };

  const valueStyles = {
    default: "text-foreground",
    success: "text-emerald-700 dark:text-emerald-400",
    warning: "text-amber-700 dark:text-amber-400",
    danger: "text-red-700 dark:text-red-400",
    info: "text-blue-700 dark:text-blue-400",
  };

  return (
    <Card className={`${variantStyles[variant]} border`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground">{title}</p>
            <p className={`text-lg font-bold ${valueStyles[variant]}`}>
              {formatMontant(value)}
            </p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
          </div>
          <div className="text-muted-foreground">{icon}</div>
        </div>
      </CardContent>
    </Card>
  );
};

export const CaisseSidePanel = () => {
  const { data: synthese, isLoading, refetch, isRefetching } = useCaisseSynthese();

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-6 w-32" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-semibold text-lg">Synthèse Financière</h3>
          <p className="text-xs text-muted-foreground">Vue d'ensemble des fonds</p>
        </div>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => refetch()}
          disabled={isRefetching}
          className="h-8 w-8 p-0"
        >
          <RefreshCw className={`h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* 1. Fond Total */}
      <SynthWidget
        title="Fond Total Caisse"
        value={synthese?.fondTotal || 0}
        icon={<Wallet className="h-5 w-5" />}
        variant={synthese?.fondTotal && synthese.fondTotal > 0 ? "success" : "danger"}
        subtitle="Solde global disponible"
      />

      {/* 2. Épargnes */}
      <SynthWidget
        title="Épargnes Collectées"
        value={synthese?.totalEpargnes || 0}
        icon={<PiggyBank className="h-5 w-5" />}
        variant="info"
        subtitle="Total des dépôts d'épargne"
      />

      {/* 3. Cotisations */}
      <SynthWidget
        title="Cotisations Encaissées"
        value={synthese?.totalCotisations || 0}
        icon={<Receipt className="h-5 w-5" />}
        variant="success"
        subtitle="Total des cotisations payées"
      />

      {/* 4. Total Prêts Décaissés */}
      <SynthWidget
        title="Total Prêts Décaissés"
        value={synthese?.pretsDecaisses || 0}
        icon={<Banknote className="h-5 w-5" />}
        variant="warning"
        subtitle="Montant total des prêts accordés"
      />

      {/* 5. Prêts en Cours (capital restant) */}
      <SynthWidget
        title="Prêts en Cours"
        value={synthese?.pretsEnCours || 0}
        icon={<TrendingUp className="h-5 w-5" />}
        variant={synthese?.pretsEnCours && synthese.pretsEnCours > 0 ? "warning" : "default"}
        subtitle="Capital restant dû"
      />

      {/* 6. Sanctions Encaissées */}
      <SynthWidget
        title="Sanctions Encaissées"
        value={synthese?.sanctionsEncaissees || 0}
        icon={<AlertTriangle className="h-5 w-5" />}
        variant="success"
        subtitle={`${synthese?.tauxRecouvrement || 0}% de recouvrement`}
      />

      {/* 7. Sanctions Impayées */}
      {(synthese?.sanctionsImpayees || 0) > 0 && (
        <Card className="border-destructive/50 bg-destructive/10">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Sanctions Impayées</p>
                <p className="text-lg font-bold text-destructive">
                  {formatMontant(synthese?.sanctionsImpayees || 0)}
                </p>
                <Badge variant="destructive" className="text-xs">À recouvrer</Badge>
              </div>
              <AlertTriangle className="h-5 w-5 text-destructive" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* 8. Aides Distribuées */}
      <SynthWidget
        title="Aides Distribuées"
        value={synthese?.aidesDistribuees || 0}
        icon={<HandCoins className="h-5 w-5" />}
        variant="default"
        subtitle="Total des aides accordées"
      />

      {/* 9. Reliquat Cotisations */}
      <SynthWidget
        title="Reliquat Cotisations"
        value={synthese?.reliquatCotisations || 0}
        icon={<Users className="h-5 w-5" />}
        variant="info"
        subtitle="Après distribution bénéficiaires"
      />

      {/* 10. Fond Sport */}
      <SynthWidget
        title="Fond Sport"
        value={synthese?.fondSport || 0}
        icon={<Trophy className="h-5 w-5" />}
        variant="default"
        subtitle="Budget activités sportives"
      />

      <Card className="mt-4 bg-muted/50">
        <CardContent className="p-3">
          <div className="text-xs text-muted-foreground space-y-1">
            <p>📊 Actualisation automatique (30s)</p>
            <p>🔄 Cliquez ↻ pour rafraîchir</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
