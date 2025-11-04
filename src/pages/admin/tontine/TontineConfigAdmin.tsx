import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings } from "lucide-react";

const TontineConfigAdmin = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Settings className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Configuration Tontine</h1>
          <p className="text-muted-foreground">Paramètres de la tontine</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">À implémenter : configuration des montants, périodicité, cycles...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default TontineConfigAdmin;
