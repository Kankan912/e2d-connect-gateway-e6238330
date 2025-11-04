import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Receipt } from "lucide-react";

const MyCotisations = () => {
  const { profile } = useAuth();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Mes Cotisations</h1>
        <p className="text-muted-foreground mt-2">
          Historique de vos cotisations annuelles
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cotisations</CardTitle>
          <CardDescription>
            Vos paiements de cotisations E2D
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-12">
            <Receipt className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">
              Aucune cotisation enregistrée pour le moment
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Cette fonctionnalité sera disponible prochainement
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default MyCotisations;
