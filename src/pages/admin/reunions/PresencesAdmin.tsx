import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckSquare } from "lucide-react";

const PresencesAdmin = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <CheckSquare className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-3xl font-bold">Gestion des Présences</h1>
          <p className="text-muted-foreground">Feuille de présence aux réunions</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Présences</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">À implémenter : sélection de réunion et feuille de présence interactive...</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PresencesAdmin;
