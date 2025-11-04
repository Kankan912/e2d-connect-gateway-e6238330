import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Flame } from "lucide-react";

const PhoenixConfigAdmin = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Flame className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Configuration Phoenix</h1>
          <p className="text-muted-foreground">Paramètres de l'équipe Phoenix</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">À implémenter : gestion des équipes, calendrier, statistiques...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PhoenixConfigAdmin;
