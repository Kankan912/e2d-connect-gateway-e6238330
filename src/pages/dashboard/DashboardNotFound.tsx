import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle } from "lucide-react";

/**
 * Route catch-all pour le Dashboard — affiche un message clair au lieu
 * de laisser un écran vide lorsqu'une URL admin n'existe pas.
 */
export default function DashboardNotFound() {
  return (
    <div className="flex items-center justify-center py-16">
      <Card className="max-w-md w-full">
        <CardContent className="pt-6 flex flex-col items-center gap-4 text-center">
          <AlertCircle className="h-10 w-10 text-muted-foreground" aria-hidden="true" />
          <h2 className="text-xl font-semibold">Page introuvable</h2>
          <p className="text-sm text-muted-foreground">
            La page demandée n'existe pas ou a été déplacée.
          </p>
          <Button asChild>
            <Link to="/dashboard">Retour au tableau de bord</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
