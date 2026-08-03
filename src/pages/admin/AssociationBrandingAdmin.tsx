/**
 * AssociationBrandingAdmin — Phase 6.
 *
 * Édite l'identité visuelle de l'association courante :
 * - Logo (associations.logo_url)
 * - Couleurs (associations.theme_tokens : primary, secondary, accent, radius)
 * - Devise/locale d'affichage (theme_tokens.currency_code, theme_tokens.locale)
 *
 * Réutilise l'infrastructure existante :
 * - AssociationContext applique déjà `theme_tokens` comme CSS vars `--tenant-*`
 * - `formatCurrencyForAssociation()` lit `currency_code` depuis `theme_tokens`
 *
 * Aucune migration requise (theme_tokens est jsonb).
 */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAssociation } from "@/contexts/AssociationContext";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { formatCurrencyForAssociation } from "@/lib/formatCurrencyDynamic";

const DEFAULT_TOKENS: Record<string, string> = {
  primary: "220 90% 56%",
  secondary: "220 14% 96%",
  accent: "220 90% 56%",
  radius: "0.5rem",
  currency_code: "FCFA",
  locale: "fr-FR",
};

export default function AssociationBrandingAdmin() {
  const { t } = useTranslation("admin");
  const { currentAssociation, refreshAssociations } = useAssociation();
  const { toast } = useToast();
  const qc = useQueryClient();


  const [tokens, setTokens] = useState<Record<string, string>>(DEFAULT_TOKENS);
  const [logoUrl, setLogoUrl] = useState<string>("");

  useEffect(() => {
    if (currentAssociation) {
      setTokens({ ...DEFAULT_TOKENS, ...(currentAssociation.theme_tokens ?? {}) });
      setLogoUrl(currentAssociation.logo_url ?? "");
    }
  }, [currentAssociation]);

  const save = useMutation({
    mutationFn: async () => {
      if (!currentAssociation) throw new Error("Aucune association sélectionnée");
      const { data, error } = await supabase
        .from("associations")
        .update({ theme_tokens: tokens, logo_url: logoUrl || null })
        .eq("id", currentAssociation.id)
        .select("id");
      if (error) throw error;
      if (!data || data.length === 0) {
        throw new Error(
          "Aucune modification enregistrée : vous n'avez pas les droits d'administration sur cette association."
        );
      }
    },
    onSuccess: () => {
      toast({ title: t("branding.saved") });
      refresh();
    },
    onError: (e: unknown) => {
      const msg = e instanceof Error ? e.message : String(e);
      toast({ title: "Erreur", description: msg, variant: "destructive" });
    },
  });

  const setToken = (k: string, v: string) => setTokens((prev) => ({ ...prev, [k]: v }));

  if (!currentAssociation) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Aucune association sélectionnée.</p>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">{t("branding.title")}</h1>
        <p className="text-muted-foreground">{t("branding.subtitle")}</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t("branding.logo")}</CardTitle>
          <CardDescription>URL publique de votre logo (bucket Storage recommandé).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Input
            placeholder="https://..."
            value={logoUrl}
            onChange={(e) => setLogoUrl(e.target.value)}
          />
          {logoUrl && (
            <img src={logoUrl} alt="Logo" className="h-20 w-20 object-contain rounded border" />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("branding.colors")}</CardTitle>
          <CardDescription>{t("branding.hsl_hint")}</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {(["primary", "secondary", "accent"] as const).map((key) => (
            <div key={key} className="space-y-2">
              <Label>{t(`branding.${key}`)}</Label>
              <div className="flex gap-2 items-center">
                <div
                  className="h-9 w-9 rounded border shrink-0"
                  style={{ background: `hsl(${tokens[key] ?? DEFAULT_TOKENS[key]})` }}
                />
                <Input
                  value={tokens[key] ?? ""}
                  onChange={(e) => setToken(key, e.target.value)}
                  placeholder={DEFAULT_TOKENS[key]}
                />
              </div>
            </div>
          ))}
          <div className="space-y-2">
            <Label>{t("branding.radius")}</Label>
            <Input
              value={tokens.radius ?? ""}
              onChange={(e) => setToken("radius", e.target.value)}
              placeholder="0.5rem"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Devise & format</CardTitle>
          <CardDescription>Devise affichée par défaut (FCFA par défaut).</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Code devise</Label>
            <select
              className="w-full h-10 rounded-md border bg-background px-3"
              value={tokens.currency_code ?? "FCFA"}
              onChange={(e) => setToken("currency_code", e.target.value)}
            >
              <option value="FCFA">FCFA</option>
              <option value="XOF">XOF (= FCFA)</option>
              <option value="EUR">EUR</option>
              <option value="USD">USD</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label>Locale</Label>
            <select
              className="w-full h-10 rounded-md border bg-background px-3"
              value={tokens.locale ?? "fr-FR"}
              onChange={(e) => setToken("locale", e.target.value)}
            >
              <option value="fr-FR">Français (fr-FR)</option>
              <option value="en-US">English US (en-US)</option>
              <option value="en-GB">English UK (en-GB)</option>
            </select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("branding.preview")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div
            className="rounded-lg p-6 text-white"
            style={{ background: `hsl(${tokens.primary})`, borderRadius: tokens.radius }}
          >
            <div className="text-2xl font-bold">{currentAssociation.nom}</div>
            <div className="opacity-90">Aperçu de la couleur primaire</div>
          </div>
          <div className="flex gap-3">
            <Button style={{ background: `hsl(${tokens.primary})` }}>Bouton primaire</Button>
            <Button variant="outline" style={{ borderColor: `hsl(${tokens.accent})`, color: `hsl(${tokens.accent})` }}>
              Accent
            </Button>
          </div>
          <Separator />
          <div className="text-lg">
            Montant exemple : <strong>{formatCurrencyForAssociation(1250000, tokens)}</strong>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3 justify-end">
        <Button
          variant="outline"
          onClick={() => {
            setTokens(DEFAULT_TOKENS);
            setLogoUrl("");
          }}
        >
          {t("branding.reset")}
        </Button>
        <Button onClick={() => save.mutate()} disabled={save.isPending}>
          {save.isPending ? "..." : "Enregistrer"}
        </Button>
      </div>
    </div>
  );
}
