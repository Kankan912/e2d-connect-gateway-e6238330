import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, PlusCircle, Building2, Copy, Pencil, ExternalLink } from "lucide-react";
import { logger } from "@/lib/logger";
import {
  AssociationWizard,
  AssociationWizardValues,
  emptyWizardValues,
} from "./_components/AssociationWizard";
import { LogoUploader } from "@/components/branding/LogoUploader";
import { PaletteEditor } from "@/components/branding/PaletteEditor";
import { TemplatePicker } from "@/components/branding/TemplatePicker";
import { DEFAULT_TEMPLATE_ID, SiteTemplateId, getTemplate } from "@/lib/siteTemplates";
import { DEFAULT_PALETTE } from "@/lib/paletteFromLogo";

interface AssociationRow {
  id: string;
  slug: string;
  nom: string;
  sigle: string | null;
  description: string | null;
  logo_url: string | null;
  locale: string;
  langue_principale: string | null;
  site_template: string | null;
  subdomain: string | null;
  email_contact: string | null;
  telephone: string | null;
  adresse: string | null;
  ville: string | null;
  pays: string | null;
  theme_tokens: Record<string, string> | null;
  statut: string;
  created_at: string;
}

const SELECT_COLS =
  "id, slug, nom, sigle, description, logo_url, locale, langue_principale, site_template, subdomain, email_contact, telephone, adresse, ville, pays, theme_tokens, statut, created_at";

export default function AssociationsPlatformAdmin() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [wizard, setWizard] = useState<AssociationWizardValues>(emptyWizardValues);
  const [lastPassword, setLastPassword] = useState<string | null>(null);
  const [editing, setEditing] = useState<AssociationRow | null>(null);

  const { data: associations = [], isLoading } = useQuery({
    queryKey: ["platform-associations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("associations")
        .select(SELECT_COLS)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AssociationRow[];
    },
  });

  const provision = useMutation({
    mutationFn: async () => {
      const payload = {
        slug: wizard.slug,
        nom: wizard.nom,
        sigle: wizard.sigle || null,
        description: wizard.description || null,
        logo_url: wizard.logo_url || null,
        locale: wizard.locale || "fr-FR",
        langue_principale: wizard.langue_principale || "fr",
        site_template: wizard.site_template,
        subdomain: wizard.subdomain || wizard.slug,
        email_contact: wizard.email_contact || null,
        telephone: wizard.telephone || null,
        adresse: wizard.adresse || null,
        ville: wizard.ville || null,
        pays: wizard.pays || null,
        theme_tokens: {
          ...wizard.theme_tokens,
          currency: wizard.currency,
          locale: wizard.locale,
        },
        admin: {
          email: wizard.admin_email,
          nom: wizard.admin_nom,
          prenom: wizard.admin_prenom,
          telephone: wizard.admin_telephone || null,
          password: wizard.admin_password || undefined,
        },
      };
      const { data, error } = await supabase.functions.invoke("provision-association", { body: payload });
      if (error) throw error;
      if (data?.success === false) throw new Error(data?.message ?? "Erreur inconnue");
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Association "${wizard.nom}" créée avec son site public`);
      const pwd = data?.generated_password ?? data?.data?.generated_password ?? null;
      setLastPassword(pwd);
      if (!pwd) setOpen(false);
      setWizard(emptyWizardValues);
      qc.invalidateQueries({ queryKey: ["platform-associations"] });
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : "Erreur lors de la création";
      logger.error("[Provision] échec:", error);
      toast.error(msg);
    },
  });

  const update = useMutation({
    mutationFn: async (row: AssociationRow) => {
      const { data, error } = await supabase
        .from("associations")
        .update({
          nom: row.nom,
          sigle: row.sigle,
          description: row.description,
          logo_url: row.logo_url,
          locale: row.locale,
          langue_principale: row.langue_principale,
          site_template: row.site_template,
          subdomain: row.subdomain,
          email_contact: row.email_contact,
          telephone: row.telephone,
          adresse: row.adresse,
          ville: row.ville,
          pays: row.pays,
          theme_tokens: row.theme_tokens,
          statut: row.statut,
        })
        .eq("id", row.id)
        .select("id");
      if (error) throw error;
      if (!data?.length) {
        throw new Error("Aucune ligne modifiée : droits insuffisants sur cette association.");
      }
      return data;
    },
    onSuccess: () => {
      toast.success("Association mise à jour");
      setEditing(null);
      qc.invalidateQueries({ queryKey: ["platform-associations"] });
    },
    onError: (error: unknown) => {
      toast.error(error instanceof Error ? error.message : "Échec de la mise à jour");
    },
  });

  const copyPassword = async () => {
    if (!lastPassword) return;
    await navigator.clipboard.writeText(lastPassword);
    toast.success("Mot de passe copié");
  };

  return (
    <div className="p-3 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            Associations (Plateforme)
          </h1>
          <p className="text-sm text-muted-foreground">
            Console super-admin : créer, paramétrer et gérer les associations et leurs sites publics.
          </p>
        </div>

        <Button
          onClick={() => {
            setWizard(emptyWizardValues);
            setLastPassword(null);
            setOpen(true);
          }}
        >
          <PlusCircle className="mr-2 h-4 w-4" />
          Nouvelle association
        </Button>
      </div>

      {/* ---------- Assistant de création ---------- */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Créer une association</DialogTitle>
            <DialogDescription>
              Assistant en 7 étapes : identité, coordonnées, charte graphique, modèle de site, langue,
              administrateur, récapitulatif.
            </DialogDescription>
          </DialogHeader>

          {lastPassword ? (
            <div className="space-y-4">
              <div className="p-4 border rounded-md bg-muted">
                <p className="text-sm font-medium mb-2">Mot de passe temporaire de l'administrateur :</p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 bg-background rounded font-mono">{lastPassword}</code>
                  <Button variant="outline" size="icon" onClick={copyPassword} aria-label="Copier">
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Il sera demandé à l'administrateur de le changer à la première connexion. Communiquez-le
                  de façon sécurisée : il ne sera plus affiché.
                </p>
              </div>
              <Button
                className="w-full"
                onClick={() => {
                  setLastPassword(null);
                  setOpen(false);
                }}
              >
                Fermer
              </Button>
            </div>
          ) : (
            <AssociationWizard
              values={wizard}
              onChange={setWizard}
              onSubmit={() => provision.mutate()}
              submitting={provision.isPending}
              onCancel={() => setOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ---------- Édition ---------- */}
      <Dialog open={!!editing} onOpenChange={(o) => !o && setEditing(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Paramétrer « {editing?.nom} »</DialogTitle>
            <DialogDescription>
              Identité, coordonnées, charte graphique et modèle du site public.
            </DialogDescription>
          </DialogHeader>

          {editing && (
            <Tabs defaultValue="identite">
              <TabsList className="flex flex-wrap h-auto">
                <TabsTrigger value="identite">Identité</TabsTrigger>
                <TabsTrigger value="contact">Coordonnées</TabsTrigger>
                <TabsTrigger value="charte">Logo & charte</TabsTrigger>
                <TabsTrigger value="site">Modèle & langue</TabsTrigger>
              </TabsList>

              <TabsContent value="identite" className="space-y-3 pt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="e-nom">Nom</Label>
                    <Input
                      id="e-nom"
                      value={editing.nom}
                      onChange={(e) => setEditing({ ...editing, nom: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="e-sigle">Sigle</Label>
                    <Input
                      id="e-sigle"
                      value={editing.sigle ?? ""}
                      onChange={(e) => setEditing({ ...editing, sigle: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="e-sub">Sous-domaine</Label>
                    <Input
                      id="e-sub"
                      value={editing.subdomain ?? ""}
                      onChange={(e) => setEditing({ ...editing, subdomain: e.target.value.toLowerCase() })}
                    />
                  </div>
                  <div>
                    <Label>Statut</Label>
                    <Select
                      value={editing.statut}
                      onValueChange={(v) => setEditing({ ...editing, statut: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="actif">Actif</SelectItem>
                        <SelectItem value="suspendu">Suspendu</SelectItem>
                        <SelectItem value="archive">Archivé</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div>
                  <Label htmlFor="e-desc">Description</Label>
                  <Textarea
                    id="e-desc"
                    rows={3}
                    value={editing.description ?? ""}
                    onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                  />
                </div>
              </TabsContent>

              <TabsContent value="contact" className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
                <div>
                  <Label htmlFor="e-email">Email de contact</Label>
                  <Input
                    id="e-email"
                    type="email"
                    value={editing.email_contact ?? ""}
                    onChange={(e) => setEditing({ ...editing, email_contact: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="e-tel">Téléphone</Label>
                  <Input
                    id="e-tel"
                    value={editing.telephone ?? ""}
                    onChange={(e) => setEditing({ ...editing, telephone: e.target.value })}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="e-adr">Adresse</Label>
                  <Input
                    id="e-adr"
                    value={editing.adresse ?? ""}
                    onChange={(e) => setEditing({ ...editing, adresse: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="e-ville">Ville</Label>
                  <Input
                    id="e-ville"
                    value={editing.ville ?? ""}
                    onChange={(e) => setEditing({ ...editing, ville: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="e-pays">Pays</Label>
                  <Input
                    id="e-pays"
                    value={editing.pays ?? ""}
                    onChange={(e) => setEditing({ ...editing, pays: e.target.value })}
                  />
                </div>
              </TabsContent>

              <TabsContent value="charte" className="space-y-4 pt-4">
                <LogoUploader
                  value={editing.logo_url}
                  onChange={(url) => setEditing({ ...editing, logo_url: url })}
                  folder="associations"
                />
                <PaletteEditor
                  tokens={editing.theme_tokens ?? { ...DEFAULT_PALETTE }}
                  onChange={(t) => setEditing({ ...editing, theme_tokens: t })}
                />
              </TabsContent>

              <TabsContent value="site" className="space-y-4 pt-4">
                <TemplatePicker
                  value={(editing.site_template as SiteTemplateId) ?? DEFAULT_TEMPLATE_ID}
                  onChange={(id) => setEditing({ ...editing, site_template: id })}
                />
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <Label>Langue principale</Label>
                    <Select
                      value={editing.langue_principale ?? "fr"}
                      onValueChange={(v) => setEditing({ ...editing, langue_principale: v })}
                    >
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
                    <Input
                      value={editing.locale ?? ""}
                      onChange={(e) => setEditing({ ...editing, locale: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label>Devise</Label>
                    <Select
                      value={editing.theme_tokens?.currency ?? "FCFA"}
                      onValueChange={(v) =>
                        setEditing({
                          ...editing,
                          theme_tokens: { ...(editing.theme_tokens ?? {}), currency: v },
                        })
                      }
                    >
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
              </TabsContent>
            </Tabs>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditing(null)} disabled={update.isPending}>
              Annuler
            </Button>
            <Button onClick={() => editing && update.mutate(editing)} disabled={update.isPending}>
              {update.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card>
        <CardHeader>
          <CardTitle>Associations existantes</CardTitle>
          <CardDescription>{associations.length} association(s) sur la plateforme.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Association</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Modèle</TableHead>
                    <TableHead>Langue</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {associations.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {a.logo_url ? (
                            <img src={a.logo_url} alt="" className="h-7 w-7 rounded object-contain" />
                          ) : (
                            <div className="h-7 w-7 rounded bg-muted" />
                          )}
                          <div>
                            <p className="font-medium">{a.nom}</p>
                            {a.sigle && <p className="text-xs text-muted-foreground">{a.sigle}</p>}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs">{a.slug}</code>
                      </TableCell>
                      <TableCell className="text-xs">{getTemplate(a.site_template).nom}</TableCell>
                      <TableCell className="text-xs">{a.langue_principale ?? a.locale}</TableCell>
                      <TableCell>
                        <Badge variant={a.statut === "actif" ? "default" : "secondary"}>{a.statut}</Badge>
                      </TableCell>
                      <TableCell className="text-right space-x-1">
                        <Button variant="ghost" size="icon" asChild aria-label="Voir le site public">
                          <a href={`/s/${a.slug}`} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label="Paramétrer"
                          onClick={() => setEditing(a)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {!associations.length && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                        Aucune association.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
