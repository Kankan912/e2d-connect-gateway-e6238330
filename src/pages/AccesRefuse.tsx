import { Link } from "react-router-dom";
import { ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface AccesRefuseProps {
  message?: string;
  homeTo?: string;
}

/**
 * Page « Accès refusé » : évite les redirections silencieuses et les écrans blancs
 * lorsqu'un utilisateur n'a pas les droits requis.
 */
export default function AccesRefuse({
  message = "Vous ne disposez pas des autorisations nécessaires pour accéder à cette page.",
  homeTo = "/dashboard",
}: AccesRefuseProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-3 sm:p-6">
      <Card className="max-w-md w-full">
        <CardContent className="p-8 text-center space-y-4">
          <ShieldAlert className="h-12 w-12 text-destructive mx-auto" />
          <h1 className="text-xl font-bold">Accès refusé</h1>
          <p className="text-sm text-muted-foreground">{message}</p>
          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <Button asChild type="button">
              <Link to={homeTo}>Retour au tableau de bord</Link>
            </Button>
            <Button asChild variant="outline" type="button">
              <Link to="/">Accueil</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
