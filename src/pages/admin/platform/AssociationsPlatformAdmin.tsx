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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Loader2, PlusCircle, Building2, Copy } from "lucide-react";
import { logger } from "@/lib/logger";

interface AssociationRow {
  id: string;
  slug: string;
  nom: string;
  description: string | null;
  logo_url: string | null;
  locale: string;
  statut: string;
  created_at: string;
}

const defaultForm = {
  slug: "",
  nom: "",
  description: "",
  logo_url: "",
  locale: "fr",
  admin_email: "",
  admin_nom: "",
  admin_prenom: "",
  admin_telephone: "",
  admin_password: "",
};

export default function AssociationsPlatformAdmin() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(defaultForm);
  const [lastPassword, setLastPassword] = useState<string | null>(null);

  const { data: associations = [], isLoading } = useQuery({
    queryKey: ["platform-associations"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("associations")
        .select("id, slug, nom, description, logo_url, locale, statut, created_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as AssociationRow[];
    },
  });

  const provision = useMutation({
    mutationFn: async () => {
      const payload = {
        slug: form.slug,
        nom: form.nom,
        description: form.description || null,
        logo_url: form.logo_url || null,
        locale: form.locale || "fr",
        admin: {
          email: form.admin_email,
          nom: form.admin_nom,
          prenom: form.admin_prenom,
          telephone: form.admin_telephone || null,
          password: form.admin_password || undefined,
        },
      };
      const { data, error } = await supabase.functions.invoke("provision-association", {
        body: payload,
      });
      if (error) throw error;
      if (data?.success === false) {
        throw new Error(data?.message ?? "Erreur inconnue");
      }
      return data;
    },
    onSuccess: (data) => {
      toast.success(`Association "${form.nom}" créée avec succès`);
      if (data?.generated_password) {
        setLastPassword(data.generated_password);
      } else {
        setLastPassword(null);
        setOpen(false);
      }
      setForm(defaultForm);
      qc.invalidateQueries({ queryKey: ["platform-associations"] });
    },
    onError: (error: unknown) => {
      const msg = error instanceof Error ? error.message : "Erreur lors de la création";
      logger.error("[Provision] échec:", error);
      toast.error(msg);
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
            Console super-admin : créer et gérer les tenants de la plateforme.
          </p>
        </div>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button>
              <PlusCircle className="mr-2 h-4 w-4" />
              Nouvelle association
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Provisionner une nouvelle association</DialogTitle>
              <DialogDescription>
                Crée un tenant complet : association, rôles par défaut, administrateur.
              </DialogDescription>
            </DialogHeader>

            {lastPassword ? (
              <div className="space-y-4">
                <div className="p-4 border rounded-md bg-muted">
                  <p className="text-sm font-medium mb-2">Mot de passe temporaire de l'administrateur :</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 p-2 bg-background rounded font-mono">{lastPassword}</code>
                    <Button variant="outline" size="icon" onClick={copyPassword}>
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Il sera demandé à l'administrateur de changer son mot de passe à la première connexion.
                    Communiquez-le lui de façon sécurisée : il ne sera plus affiché.
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
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  provision.mutate();
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="slug">Slug (identifiant URL) *</Label>
                    <Input
                      id="slug"
                      required
                      value={form.slug}
                      onChange={(e) => setForm({ ...form, slug: e.target.value.toLowerCase() })}
                      placeholder="mon-association"
                      pattern="^[a-z][a-z0-9-]{1,30}[a-z0-9]$"
                    />
                  </div>
                  <div>
                    <Label htmlFor="nom">Nom *</Label>
                    <Input
                      id="nom"
                      required
                      value={form.nom}
                      onChange={(e) => setForm({ ...form, nom: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={form.description}
                    onChange={(e) => setForm({ ...form, description: e.target.value })}
                    rows={2}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="logo_url">Logo URL</Label>
                    <Input
                      id="logo_url"
                      value={form.logo_url}
                      onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="locale">Locale</Label>
                    <Input
                      id="locale"
                      value={form.locale}
                      onChange={(e) => setForm({ ...form, locale: e.target.value })}
                    />
                  </div>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-medium mb-3">Administrateur initial</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="admin_prenom">Prénom *</Label>
                      <Input
                        id="admin_prenom"
                        required
                        value={form.admin_prenom}
                        onChange={(e) => setForm({ ...form, admin_prenom: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="admin_nom">Nom *</Label>
                      <Input
                        id="admin_nom"
                        required
                        value={form.admin_nom}
                        onChange={(e) => setForm({ ...form, admin_nom: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="admin_email">Email *</Label>
                      <Input
                        id="admin_email"
                        type="email"
                        required
                        value={form.admin_email}
                        onChange={(e) => setForm({ ...form, admin_email: e.target.value })}
                      />
                    </div>
                    <div>
                      <Label htmlFor="admin_telephone">Téléphone</Label>
                      <Input
                        id="admin_telephone"
                        value={form.admin_telephone}
                        onChange={(e) => setForm({ ...form, admin_telephone: e.target.value })}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <Label htmlFor="admin_password">Mot de passe (laisser vide pour génération auto)</Label>
                      <Input
                        id="admin_password"
                        type="text"
                        value={form.admin_password}
                        onChange={(e) => setForm({ ...form, admin_password: e.target.value })}
                        placeholder="Min. 8 caractères, lettres + chiffres"
                      />
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                    disabled={provision.isPending}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={provision.isPending}>
                    {provision.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Créer l'association
                  </Button>
                </DialogFooter>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Associations existantes</CardTitle>
          <CardDescription>{associations.length} tenant(s) sur la plateforme.</CardDescription>
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
                    <TableHead>Nom</TableHead>
                    <TableHead>Slug</TableHead>
                    <TableHead>Locale</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Créé le</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {associations.map((a) => (
                    <TableRow key={a.id}>
                      <TableCell className="font-medium">{a.nom}</TableCell>
                      <TableCell>
                        <code className="text-xs">{a.slug}</code>
                      </TableCell>
                      <TableCell>{a.locale}</TableCell>
                      <TableCell>
                        <Badge variant={a.statut === "actif" ? "default" : "secondary"}>{a.statut}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {new Date(a.created_at).toLocaleDateString("fr-FR")}
                      </TableCell>
                    </TableRow>
                  ))}
                  {!associations.length && (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
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
