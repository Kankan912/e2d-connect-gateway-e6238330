import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Key, Send, Eye, EyeOff, Loader2, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import type { EmailConfigController } from "./useEmailConfig";

export function ResendProviderCard({ c }: { c: EmailConfigController }) {
  const err = c.fieldErrors;

  return (
    <Card className={cn("relative", c.emailService === "resend" && "border-primary ring-1 ring-primary/40")}>
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Key className="h-5 w-5" />
              Resend API
            </CardTitle>
            <CardDescription>Service transactionnel, idéal avec un domaine pro</CardDescription>
          </div>
          {c.emailService === "resend" ? (
            <Badge className="bg-primary text-primary-foreground hover:bg-primary">Actif</Badge>
          ) : (
            <Badge variant="secondary">En réserve</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription className="text-xs">
            <strong>Mode test :</strong> sans domaine vérifié, les emails partent uniquement vers l'adresse du
            propriétaire du compte Resend.{" "}
            <a
              href="https://resend.com/domains"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-medium"
            >
              Vérifiez un domaine
            </a>{" "}
            pour envoyer à tous les membres.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <Label htmlFor="resend-api-key">
            Clé API Resend
            {c.smtpConfigId && (
              <span className="ml-2 text-xs text-muted-foreground font-normal">
                (laisser vide pour conserver l'existante)
              </span>
            )}
          </Label>
          <div className="relative">
            <Input
              id="resend-api-key"
              type={c.showResendKey ? "text" : "password"}
              placeholder="re_xxxxxxxx..."
              autoComplete="new-password"
              value={c.resendApiKey}
              onChange={(e) => c.setResendApiKey(e.target.value)}
              aria-invalid={!!err.resendApiKey}
              className={cn(err.resendApiKey && "border-destructive focus-visible:ring-destructive")}
            />
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-0 top-0 h-full px-3"
              onClick={() => c.setShowResendKey(!c.showResendKey)}
            >
              {c.showResendKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </div>
          {err.resendApiKey && <p className="text-xs text-destructive">{err.resendApiKey}</p>}
          <p className="text-xs text-muted-foreground">
            Obtenez votre clé sur{" "}
            <a
              href="https://resend.com/api-keys"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              resend.com/api-keys
            </a>
          </p>
        </div>

        <Button
          variant="secondary"
          className="w-full"
          onClick={c.saveResendKey}
          disabled={c.savingResendKey || !c.resendApiKey}
        >
          {c.savingResendKey ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Key className="h-4 w-4 mr-2" />
          )}
          Enregistrer la clé API
        </Button>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <Button
            variant="outline"
            onClick={() => c.runConfigurationTest("resend")}
            disabled={c.testingResend}
            className="flex-1"
          >
            {c.testingResend ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-2" />
            )}
            Tester Resend
          </Button>
          {c.emailService !== "resend" && (
            <Button onClick={() => c.requestSwitchProvider("resend")} className="flex-1">
              Basculer sur Resend
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
