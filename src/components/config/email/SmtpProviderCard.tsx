import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Server, Send, Eye, EyeOff, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { EmailConfigController } from "./useEmailConfig";
import type { SmtpEncryption } from "./emailConfigSchemas";

export function SmtpProviderCard({ c }: { c: EmailConfigController }) {
  const err = c.fieldErrors;
  const invalid = (k: string) => cn(err[k] && "border-destructive focus-visible:ring-destructive");

  return (
    <Card className={cn("relative", c.emailService === "smtp" && "border-primary ring-1 ring-primary/40")}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Server className="h-5 w-5" />
              SMTP personnalisé
            </CardTitle>
            <CardDescription>Votre propre serveur (Gmail, Outlook, OVH…)</CardDescription>
          </div>
          {c.emailService === "smtp" ? (
            <Badge className="bg-primary text-primary-foreground hover:bg-primary">Actif</Badge>
          ) : (
            <Badge variant="secondary">En réserve</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="smtp-host">Serveur SMTP</Label>
            <Input
              id="smtp-host"
              placeholder="smtp.gmail.com"
              value={c.smtpHost}
              onChange={(e) => c.setSmtpHost(e.target.value)}
              aria-invalid={!!err.smtpHost}
              className={invalid("smtpHost")}
            />
            {err.smtpHost && <p className="text-xs text-destructive">{err.smtpHost}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="smtp-port">Port</Label>
            <Input
              id="smtp-port"
              type="number"
              min={1}
              max={65535}
              placeholder="587"
              value={c.smtpPort}
              onChange={(e) => c.setSmtpPort(e.target.value)}
              aria-invalid={!!err.smtpPort}
              className={invalid("smtpPort")}
            />
            {err.smtpPort && <p className="text-xs text-destructive">{err.smtpPort}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="smtp-user">Utilisateur</Label>
          <Input
            id="smtp-user"
            type="email"
            placeholder="votre@email.com"
            value={c.smtpUser}
            onChange={(e) => c.setSmtpUser(e.target.value)}
            aria-invalid={!!err.smtpUser}
            className={invalid("smtpUser")}
          />
          {err.smtpUser && <p className="text-xs text-destructive">{err.smtpUser}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="smtp-password" className="flex items-center gap-2">
              Mot de passe
              {c.smtpConfigId && !c.smtpPassword && (
                <Badge variant="outline" className="text-xs font-normal">Défini</Badge>
              )}
            </Label>
            {c.smtpConfigId && (
              <Button
                type="button"
                variant="link"
                size="sm"
                className="h-auto p-0 text-xs"
                onClick={() => {
                  document.getElementById("smtp-password")?.focus();
                  toast.info("Saisissez le nouveau mot de passe puis Sauvegarder");
                }}
              >
                Réinitialiser
              </Button>
            )}
          </div>
          {c.smtpConfigId && (
            <p className="text-xs text-muted-foreground">
              Laisser vide pour conserver le mot de passe existant.
            </p>
          )}
          <div className="relative">
            <Input
              id="smtp-password"
              type={c.showPassword ? "text" : "password"}
              placeholder="••••••••"
              autoComplete="new-password"
              value={c.smtpPassword}
              onChange={(e) => c.setSmtpPassword(e.target.value)}
              aria-invalid={!!err.smtpPassword}
              className={invalid("smtpPassword")}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => c.setShowPassword(!c.showPassword)}
            >
              {c.showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {err.smtpPassword && <p className="text-xs text-destructive">{err.smtpPassword}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="smtp-encryption">Chiffrement</Label>
          <Select value={c.smtpEncryption} onValueChange={(v) => c.setSmtpEncryption(v as SmtpEncryption)}>
            <SelectTrigger id="smtp-encryption">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tls">TLS (recommandé)</SelectItem>
              <SelectItem value="ssl">SSL</SelectItem>
              <SelectItem value="none">Aucun</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => c.runConfigurationTest("smtp")}
            disabled={c.testingSmtp}
            className="flex-1"
          >
            {c.testingSmtp ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Send className="h-4 w-4 mr-2" />}
            Tester SMTP
          </Button>
          {c.emailService !== "smtp" && (
            <Button onClick={() => c.requestSwitchProvider("smtp")} disabled={!c.smtpReady} className="flex-1">
              Basculer sur SMTP
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
