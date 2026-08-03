import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, Send } from "lucide-react";
import type { EmailConfigController } from "./useEmailConfig";

export function EmailConfigStatusBanner({ c }: { c: EmailConfigController }) {
  const { configStatus, lastTestResult } = c;

  return (
    <Alert variant={configStatus.valid ? "default" : "destructive"}>
      {configStatus.valid ? <CheckCircle className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
      <AlertDescription>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <span>
            <strong>{configStatus.valid ? "Configuration valide" : "Configuration invalide"}</strong>
            {" — "}
            {configStatus.message}
            {lastTestResult?.success && lastTestResult.fallback && (
              <Badge variant="secondary" className="ml-2">
                Dernier envoi : fallback {lastTestResult.provider}
              </Badge>
            )}
          </span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => c.runConfigurationTest("auto", true)}
            disabled={c.sendingTestEmail}
          >
            {c.sendingTestEmail ? (
              <Loader2 className="h-4 w-4 mr-1 animate-spin" />
            ) : (
              <Send className="h-4 w-4 mr-1" />
            )}
            Tester la configuration
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}
