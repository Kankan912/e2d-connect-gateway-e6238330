import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Wand2, ArrowLeft, ArrowRight, Check } from "lucide-react";
import { toast } from "sonner";
import { LogoUploader } from "@/components/branding/LogoUploader";
import { PaletteEditor } from "@/components/branding/PaletteEditor";
import { TemplatePicker } from "@/components/branding/TemplatePicker";
import { DEFAULT_PALETTE, paletteFromLogo } from "@/lib/paletteFromLogo";
import { DEFAULT_TEMPLATE_ID, SiteTemplateId, getTemplate } from "@/lib/siteTemplates";
import { logger } from "@/lib/logger";

export interface AssociationWizardValues {
  slug: string;
  nom: string;
  sigle: string;
  description: string;
  email_contact: string;
  telephone: string;
  adresse: string;
  ville: string;
  pays: string;
  subdomain: string;
  logo_url: string;
  theme_tokens: Record<string, string>;
  site_template: SiteTemplateId;
  langue_principale: string;
  locale: string;
  currency: string;
  admin_prenom: string;
  admin_nom: string;
  admin_email: string;
  admin_telephone: string;
  admin_password: string;
}

export const emptyWizardValues: AssociationWizardValues = {
  slug: "",
  nom: "",
  sigle: "",
  description: "",
  email_contact: "",
  telephone: "",
  adresse: "",
  ville: "",
  pays: "",
  subdomain: "",
  logo_url: "",
  theme_tokens: { ...DEFAULT_PALETTE },
  site_template: DEFAULT_TEMPLATE_ID,
  langue_principale: "fr",
  locale: "fr-FR",
  currency: "FCFA",
  admin_prenom: "",
  admin_nom: "",
  admin_email: "",
  admin_telephone: "",
  admin_password: "",
};

const STEPS = [
  "Identité",
  "Coordonnées",
  "Logo & charte",
  "Modèle de site",
  "Langue & devise",
  "Administrateur",
  "Récapitulatif",
];

const slugify = (v: string) =>
  v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);

interface Props {
  values: AssociationWizardValues;
  onChange: (values: AssociationWizardValues) => void;
  onSubmit: () => void;
  submitting: boolean;
  onCancel: () => void;
}

/** Assistant de création d'association en 7 étapes. */
export const AssociationWizard = ({ values, onChange, onSubmit, submitting, onCancel }: Props) => {
  const [step, setStep] = useState(0);
  const [extracting, setExtracting] = useState(false);

  const set = <K extends keyof AssociationWizardValues>(key: K, value: AssociationWizardValues[K]) =>
    onChange({ ...values, [key]: value });

  const stepValid = useMemo(() => {
    switch (step) {
      case 0:
        return values.nom.trim().length >= 2 && /^[a-z][a-z0-9-]{1,30}[a-z0-9]$/.test(values.slug);
      case 5:
        return (
          values.admin_prenom.trim() !== "" &&
          values.admin_nom.trim() !== "" &&
          /.+@.+\..+/.test(values.admin_email)
        );
      default:
        return true;
    }
  }, [step, values]);

  const generatePalette = async () => {
    if (!values.logo_url) {
      toast.error("Téléversez d'abord un logo.");
      return;
    }
    setExtracting(true);
    try {
      const palette = await paletteFromLogo(values.logo_url);
      onChange({ ...values, theme_tokens: { ...values.theme_tokens, ...palette } });
      toast.success("Charte générée depuis le logo");
    } catch (error: unknown) {
      logger.error("[Wizard] extraction palette:", error);
      toast.error("Impossible d'extraire les couleurs du logo (image distante protégée ?)");
    } finally {
      setExtracting(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="space-y-2">
        <Progress value={((step + 1) / STEPS.length) * 100} />
        <p className="text-xs text-muted-foreground">
          Étape {step + 1} / {STEPS.length} — {STEPS[step]}
        </p>
      </div>

      {step === 0 && (
        <div className="space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="w-nom">Nom de l'association *</Label>
              <Input
                id="w-nom"
                value={values.nom}
                onChange={(e) => {
                  const nom = e.target.value;
                  onChange({
                    ...values,
                    nom,
                    slug: values.slug || slugify(nom),
                    subdomain: values.subdomain || slugify(nom),
                  });
                }}
              />
            </div>
            <div>
              <Label htmlFor="w-sigle">Sigle</Label>
              <Input id="w-sigle" value={values.sigle} onChange={(e) => set("sigle", e.target.value)} />
            </div>
            <div>
              <Label htmlFor="w-slug">Identifiant URL (slug) *</Label>
              <Input
                id="w-slug"
                value={values.slug}
                onChange={(e) => set("slug", slugify(e.target.value))}
                placeholder="mon-association"
              />
            </div>
            <div>
              <Label htmlFor="w-subdomain">Sous-domaine</Label>
              <Input
                id="w-subdomain"
                value={values.subdomain}
                onChange={(e) => set("subdomain", slugify(e.target.value))}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="w-desc">Description</Label>
            <Textarea
              id="w-desc"
              rows={3}
              value={values.description}
              onChange={(e) => set("description", e.target.value)}
            />
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="w-email">Email de contact</Label>
            <Input
              id="w-email"
              type="email"
              value={values.email_contact}
              onChange={(e) => set("email_contact", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="w-tel">Téléphone</Label>
            <Input id="w-tel" value={values.telephone} onChange={(e) => set("telephone", e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="w-adresse">Adresse</Label>
            <Input id="w-adresse" value={values.adresse} onChange={(e) => set("adresse", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="w-ville">Ville</Label>
            <Input id="w-ville" value={values.ville} onChange={(e) => set("ville", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="w-pays">Pays</Label>
            <Input id="w-pays" value={values.pays} onChange={(e) => set("pays", e.target.value)} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="space-y-4">
          <LogoUploader
            value={values.logo_url || null}
            onChange={(url) => set("logo_url", url ?? "")}
            folder="associations"
          />
          <Button type="button" variant="secondary" onClick={generatePalette} disabled={extracting}>
            {extracting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Wand2 className="mr-2 h-4 w-4" />}
            Générer la charte depuis le logo
          </Button>
          <PaletteEditor tokens={values.theme_tokens} onChange={(t) => set("theme_tokens", t)} />
        </div>
      )}

      {step === 3 && (
        <TemplatePicker value={values.site_template} onChange={(id) => set("site_template", id)} />
      )}

      {step === 4 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <Label>Langue principale</Label>
            <Select value={values.langue_principale} onValueChange={(v) => set("langue_principale", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr">Français</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Format régional</Label>
            <Select value={values.locale} onValueChange={(v) => set("locale", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fr-FR">fr-FR</SelectItem>
                <SelectItem value="fr-CM">fr-CM</SelectItem>
                <SelectItem value="en-US">en-US</SelectItem>
                <SelectItem value="en-GB">en-GB</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Devise</Label>
            <Select value={values.currency} onValueChange={(v) => set("currency", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="FCFA">FCFA</SelectItem>
                <SelectItem value="EUR">EUR</SelectItem>
                <SelectItem value="USD">USD</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {step === 5 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label htmlFor="w-aprenom">Prénom *</Label>
            <Input
              id="w-aprenom"
              value={values.admin_prenom}
              onChange={(e) => set("admin_prenom", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="w-anom">Nom *</Label>
            <Input id="w-anom" value={values.admin_nom} onChange={(e) => set("admin_nom", e.target.value)} />
          </div>
          <div>
            <Label htmlFor="w-aemail">Email *</Label>
            <Input
              id="w-aemail"
              type="email"
              value={values.admin_email}
              onChange={(e) => set("admin_email", e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="w-atel">Téléphone</Label>
            <Input
              id="w-atel"
              value={values.admin_telephone}
              onChange={(e) => set("admin_telephone", e.target.value)}
            />
          </div>
          <div className="sm:col-span-2">
            <Label htmlFor="w-apass">Mot de passe (vide = génération automatique)</Label>
            <Input
              id="w-apass"
              value={values.admin_password}
              onChange={(e) => set("admin_password", e.target.value)}
              placeholder="Min. 8 caractères"
            />
          </div>
        </div>
      )}

      {step === 6 && (
        <div className="space-y-3 text-sm">
          <div className="rounded-md border p-3 space-y-1">
            <p className="font-medium">{values.nom} {values.sigle && `(${values.sigle})`}</p>
            <p className="text-muted-foreground text-xs">
              Portail : /s/{values.slug} · Sous-domaine : {values.subdomain || values.slug}
            </p>
            <p className="text-muted-foreground text-xs">
              Modèle : {getTemplate(values.site_template).nom} · Langue : {values.langue_principale} ·
              Devise : {values.currency}
            </p>
            <p className="text-muted-foreground text-xs">
              Administrateur : {values.admin_prenom} {values.admin_nom} — {values.admin_email}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {["primary", "secondary", "accent", "menu", "background"].map((k) => (
              <div key={k} className="text-center">
                <div
                  className="h-10 w-16 rounded border"
                  style={{ backgroundColor: `hsl(${values.theme_tokens[k] ?? "0 0% 100%"})` }}
                />
                <span className="text-[10px] text-muted-foreground">{k}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            La création génère l'association, ses rôles, son administrateur et son site public
            (accueil, à propos, configuration de contact).
          </p>
        </div>
      )}

      <div className="flex items-center justify-between gap-2 border-t pt-4">
        <Button
          type="button"
          variant="ghost"
          onClick={() => (step === 0 ? onCancel() : setStep(step - 1))}
          disabled={submitting}
        >
          {step === 0 ? "Annuler" : <><ArrowLeft className="mr-2 h-4 w-4" />Précédent</>}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button type="button" onClick={() => setStep(step + 1)} disabled={!stepValid}>
            Suivant
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        ) : (
          <Button type="button" onClick={onSubmit} disabled={submitting}>
            {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
            Créer l'association
          </Button>
        )}
      </div>
    </div>
  );
};
