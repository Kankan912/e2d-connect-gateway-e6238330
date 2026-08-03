import { Link } from "react-router-dom";
import { AlertTriangle, Mail, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export interface AssociationIndisponibleProps {
  nom?: string | null;
  logoUrl?: string | null;
  emailContact?: string | null;
  telephone?: string | null;
  statut?: string | null;
}

const MESSAGE =
  "Cette association est temporairement indisponible. Veuillez contacter l'administrateur de la plateforme pour obtenir davantage d'informations.";

/**
 * Écran affiché à la place du site public / du portail lorsqu'une association
 * n'est pas active. Aucune donnée métier n'est chargée ni affichée.
 */
export default function AssociationIndisponible({
  nom,
  logoUrl,
  emailContact,
  telephone,
}: AssociationIndisponibleProps) {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-3 sm:p-6">
      <Card className="max-w-lg w-full">
        <CardContent className="p-8 text-center space-y-5">
          {logoUrl ? (
            <img
              src={logoUrl}
              alt={nom ? `Logo de ${nom}` : "Logo de l'association"}
              className="h-20 w-20 object-contain mx-auto rounded"
              loading="lazy"
            />
          ) : (
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto" />
          )}

          {nom && <h1 className="text-2xl font-bold">{nom}</h1>}

          <p className="text-muted-foreground">{MESSAGE}</p>

          {(emailContact || telephone) && (
            <div className="text-sm space-y-1">
              {emailContact && (
                <p className="flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4" /> {emailContact}
                </p>
              )}
              {telephone && (
                <p className="flex items-center justify-center gap-2">
                  <Phone className="h-4 w-4" /> {telephone}
                </p>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <Button asChild type="button">
              <Link to="/">Retour à l'accueil</Link>
            </Button>
            {emailContact && (
              <Button asChild variant="outline" type="button">
                <a href={`mailto:${emailContact}`}>Contacter</a>
              </Button>
            )}
            {!emailContact && telephone && (
              <Button asChild variant="outline" type="button">
                <a href={`tel:${telephone}`}>Appeler</a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
