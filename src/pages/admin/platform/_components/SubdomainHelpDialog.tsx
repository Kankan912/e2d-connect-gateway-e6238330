import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Globe } from "lucide-react";
import { BASE_DOMAIN, RESERVED_SUBDOMAINS } from "@/lib/subdomain";

/**
 * Écran d'aide : réglages à effectuer chez l'hébergeur du domaine pour que
 * chaque association soit accessible sur son propre sous-domaine.
 */
export const SubdomainHelpDialog = () => {
  const [open, setOpen] = useState(false);
  const domain = BASE_DOMAIN || "votre-domaine.com";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button type="button" variant="outline">
          <Globe className="mr-2 h-4 w-4" />
          Aide sous-domaines
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Donner un sous-domaine à chaque association</DialogTitle>
          <DialogDescription>
            L'application reconnaît déjà l'association à partir de l'adresse visitée. Il reste à
            déclarer les adresses chez votre hébergeur de domaine.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 text-sm">
          <section className="space-y-2">
            <h3 className="font-semibold">1. Choisir le sous-domaine</h3>
            <p className="text-muted-foreground">
              Dans la fiche de l'association, renseignez le champ « Sous-domaine » (lettres
              minuscules, chiffres et tirets). L'adresse finale sera par exemple{" "}
              <code className="font-mono">phoenix.{domain}</code>.
            </p>
            <p className="text-muted-foreground">
              Préfixes réservés, non utilisables : {RESERVED_SUBDOMAINS.join(", ")}.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">2. Déclarer l'adresse chez l'hébergeur</h3>
            <p className="text-muted-foreground">
              Ajoutez un enregistrement pour chaque association, ou un seul enregistrement
              « joker » qui couvre toutes les associations :
            </p>
            <div className="rounded-md border overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2">Type</th>
                    <th className="text-left p-2">Nom</th>
                    <th className="text-left p-2">Valeur</th>
                  </tr>
                </thead>
                <tbody className="font-mono">
                  <tr className="border-t">
                    <td className="p-2">A</td>
                    <td className="p-2">phoenix</td>
                    <td className="p-2">185.158.133.1</td>
                  </tr>
                  <tr className="border-t">
                    <td className="p-2">A</td>
                    <td className="p-2">*</td>
                    <td className="p-2">185.158.133.1</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <p className="text-muted-foreground">
              La propagation peut prendre jusqu'à 72 heures. Le certificat de sécurité (https) est
              ensuite délivré automatiquement.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">3. Raccorder l'adresse au projet</h3>
            <p className="text-muted-foreground">
              Chaque adresse doit aussi être ajoutée dans les paramètres du projet, section
              Domaines. Un domaine « joker » n'est pas pris en charge&nbsp;: ajoutez une entrée par
              association.
            </p>
          </section>

          <section className="space-y-2">
            <h3 className="font-semibold">En attendant</h3>
            <p className="text-muted-foreground">
              Sans réglage chez l'hébergeur, chaque site public reste accessible par son adresse
              courte : <code className="font-mono">/s/identifiant-de-l-association</code>.
            </p>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
};
