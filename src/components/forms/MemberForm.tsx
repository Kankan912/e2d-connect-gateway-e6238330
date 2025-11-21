import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Member } from "@/hooks/useMembers";

const memberSchema = z.object({
  nom: z.string().min(2, "Nom requis"),
  prenom: z.string().min(2, "Prénom requis"),
  telephone: z.string().min(10, "Téléphone requis"),
  email: z.string().email("Email invalide").optional().or(z.literal("")),
  statut: z.enum(["actif", "inactif", "suspendu"]),
  est_membre_e2d: z.boolean(),
  est_adherent_phoenix: z.boolean(),
  equipe_e2d: z.string().optional(),
  equipe_phoenix: z.string().optional(),
  equipe_jaune_rouge: z.enum(["jaune", "rouge", ""]).optional(),
  fonction: z.string().optional(),
});

type MemberFormData = z.infer<typeof memberSchema>;

interface MemberFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: Member | null;
  onSubmit: (data: MemberFormData) => void;
  isLoading?: boolean;
}

export default function MemberForm({ open, onOpenChange, member, onSubmit, isLoading }: MemberFormProps) {
  const form = useForm<MemberFormData>({
    resolver: zodResolver(memberSchema),
    defaultValues: member ? {
      nom: member.nom,
      prenom: member.prenom,
      telephone: member.telephone,
      email: member.email || "",
      statut: member.statut as "actif" | "inactif" | "suspendu",
      est_membre_e2d: member.est_membre_e2d || false,
      est_adherent_phoenix: member.est_adherent_phoenix || false,
      equipe_e2d: member.equipe_e2d || "",
      equipe_phoenix: member.equipe_phoenix || "",
      equipe_jaune_rouge: ((member as any).equipe_jaune_rouge as "jaune" | "rouge" | "") || "",
      fonction: member.fonction || "",
    } : {
      nom: "",
      prenom: "",
      telephone: "",
      email: "",
      statut: "actif",
      est_membre_e2d: false,
      est_adherent_phoenix: false,
      equipe_e2d: "",
      equipe_phoenix: "",
      equipe_jaune_rouge: "",
      fonction: "",
    },
  });

  const handleSubmit = (data: MemberFormData) => {
    onSubmit(data);
    if (!member) {
      form.reset();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{member ? "Modifier le Membre" : "Nouveau Membre"}</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="prenom"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="telephone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone *</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="statut"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Statut *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="actif">Actif</SelectItem>
                        <SelectItem value="inactif">Inactif</SelectItem>
                        <SelectItem value="suspendu">Suspendu</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="fonction"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Fonction</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Secrétaire" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="space-y-3 border p-4 rounded-lg">
              <h4 className="font-medium">Appartenance</h4>
              <FormField
                control={form.control}
                name="est_membre_e2d"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0 cursor-pointer">Membre E2D</FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="est_adherent_phoenix"
                render={({ field }) => (
                  <FormItem className="flex items-center space-x-2">
                    <FormControl>
                      <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                    <FormLabel className="!mt-0 cursor-pointer">Adhérent Phoenix</FormLabel>
                  </FormItem>
                )}
              />
            </div>

            {form.watch("est_membre_e2d") && (
              <FormField
                control={form.control}
                name="equipe_e2d"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Équipe E2D</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Seniors" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            {form.watch("est_adherent_phoenix") && (
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="equipe_phoenix"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Équipe Phoenix</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Vétérans" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="equipe_jaune_rouge"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Équipe Jaune/Rouge</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Choisir" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Non assigné</SelectItem>
                          <SelectItem value="jaune">Jaune</SelectItem>
                          <SelectItem value="rouge">Rouge</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Enregistrement..." : member ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
