import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { EmailConfigController } from "./useEmailConfig";

export function SwitchProviderDialog({ c }: { c: EmailConfigController }) {
  const target = c.switchTarget;

  return (
    <AlertDialog open={target !== null} onOpenChange={(open) => !open && c.setSwitchTarget(null)}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Basculer les envois d'emails sur {target === "smtp" ? "SMTP" : "Resend"} ?
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm">
              <p>
                <strong>Impact immédiat :</strong> tous les emails applicatifs (invitations,
                réinitialisations de mot de passe, notifications, compte-rendus de réunion,
                rappels de cotisation…) partiront désormais via{" "}
                <strong>{target === "smtp" ? "SMTP" : "Resend"}</strong>.
              </p>
              <p>
                Le provider précédent (<strong>{target === "smtp" ? "Resend" : "SMTP"}</strong>) reste
                configuré et sert de <strong>fallback automatique</strong> si le principal échoue.
              </p>
              {target === "resend" ? (
                <p className="text-muted-foreground">
                  ⚠ Sans domaine vérifié dans Resend, seuls les emails vers l'adresse du propriétaire
                  du compte Resend aboutiront.
                </p>
              ) : (
                <p className="text-muted-foreground">
                  ⚠ Assurez-vous d'avoir testé la connexion SMTP au moins une fois avant de basculer
                  en production.
                </p>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annuler</AlertDialogCancel>
          <AlertDialogAction onClick={() => target && c.confirmSwitchProvider(target)}>
            Confirmer la bascule
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
