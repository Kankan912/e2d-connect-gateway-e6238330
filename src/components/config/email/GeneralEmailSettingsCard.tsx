import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EmailConfigController } from "./useEmailConfig";

export function GeneralEmailSettingsCard({ c }: { c: EmailConfigController }) {
  const err = c.fieldErrors;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Globe className="h-5 w-5" />
          Configuration Générale
        </CardTitle>
        <CardDescription>Paramètres utilisés dans tous les emails</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="app-url">URL de l'application</Label>
          <Input
            id="app-url"
            type="url"
            placeholder="https://votre-domaine.com"
            value={c.appUrl}
            onChange={(e) => c.setAppUrl(e.target.value)}
            aria-invalid={!!err.appUrl}
            className={cn(err.appUrl && "border-destructive focus-visible:ring-destructive")}
          />
          {err.appUrl ? (
            <p className="text-xs text-destructive">{err.appUrl}</p>
          ) : (
            <p className="text-xs text-muted-foreground">
              Utilisée dans les emails pour les liens de connexion (variable {"{{app_url}}"})
            </p>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="from-name">Nom de l'expéditeur</Label>
            <Input
              id="from-name"
              placeholder="E2D"
              maxLength={100}
              value={c.emailExpediteurNom}
              onChange={(e) => c.setEmailExpediteurNom(e.target.value)}
              aria-invalid={!!err.emailExpediteurNom}
              className={cn(err.emailExpediteurNom && "border-destructive focus-visible:ring-destructive")}
            />
            {err.emailExpediteurNom && <p className="text-xs text-destructive">{err.emailExpediteurNom}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="from-email">Email expéditeur</Label>
            <Input
              id="from-email"
              type="email"
              placeholder="contact@e2d.org"
              value={c.emailExpediteur}
              onChange={(e) => c.setEmailExpediteur(e.target.value)}
              aria-invalid={!!err.emailExpediteur}
              className={cn(err.emailExpediteur && "border-destructive focus-visible:ring-destructive")}
            />
            {err.emailExpediteur && <p className="text-xs text-destructive">{err.emailExpediteur}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
