import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useCreateLoanRequest } from "@/hooks/useLoanRequests";

const schema = z.object({
  montant: z.coerce.number().int("Sans décimales").positive("Montant > 0"),
  description: z.string().trim().min(5, "Description trop courte").max(2000),
  urgence: z.enum(["normal", "urgent"]),
  duree_mois: z.coerce.number().int().positive("Durée > 0").max(120),
  capacite_remboursement: z.string().trim().min(3, "Précisez votre capacité"),
  garantie: z.string().trim().max(500).optional().or(z.literal("")),
  conditions_acceptees: z.literal(true, {
    errorMap: () => ({ message: "Vous devez accepter les conditions" }),
  }),
});

type FormValues = z.infer<typeof schema>;

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

export function LoanRequestDialog({ open, onOpenChange }: Props) {
  const create = useCreateLoanRequest();
  const [submitting, setSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      montant: 0,
      description: "",
      urgence: "normal",
      duree_mois: 6,
      capacite_remboursement: "",
      garantie: "",
      conditions_acceptees: false as unknown as true,
    },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      await create.mutateAsync({
        ...values,
        garantie: values.garantie?.trim() || null,
      });
      form.reset();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Demande de prêt</DialogTitle>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <Label htmlFor="montant">Montant demandé (FCFA) *</Label>
            <Input id="montant" type="number" min={1} step={1} {...form.register("montant")} />
            {form.formState.errors.montant && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.montant.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="duree_mois">Durée souhaitée (mois) *</Label>
            <Input id="duree_mois" type="number" min={1} max={120} {...form.register("duree_mois")} />
            {form.formState.errors.duree_mois && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.duree_mois.message}</p>
            )}
          </div>

          <div>
            <Label>Niveau d'urgence *</Label>
            <Select
              defaultValue="normal"
              onValueChange={(v) => form.setValue("urgence", v as "normal" | "urgent")}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="normal">Normal</SelectItem>
                <SelectItem value="urgent">Urgent</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="description">Objet / Description *</Label>
            <Textarea id="description" rows={3} {...form.register("description")} />
            {form.formState.errors.description && (
              <p className="text-xs text-destructive mt-1">{form.formState.errors.description.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="capacite_remboursement">Capacité de remboursement *</Label>
            <Input
              id="capacite_remboursement"
              placeholder="Ex: 50 000 FCFA / mois"
              {...form.register("capacite_remboursement")}
            />
            {form.formState.errors.capacite_remboursement && (
              <p className="text-xs text-destructive mt-1">
                {form.formState.errors.capacite_remboursement.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="garantie">Garantie (optionnel)</Label>
            <Input id="garantie" {...form.register("garantie")} />
          </div>

          <div className="flex items-start gap-2">
            <Checkbox
              id="conditions"
              checked={!!form.watch("conditions_acceptees")}
              onCheckedChange={(v) => form.setValue("conditions_acceptees", v === true ? true : (false as unknown as true), { shouldValidate: true })}
            />
            <Label htmlFor="conditions" className="text-sm leading-tight">
              J'accepte les conditions de prêt et m'engage à respecter le calendrier de remboursement
            </Label>
          </div>
          {form.formState.errors.conditions_acceptees && (
            <p className="text-xs text-destructive">
              {form.formState.errors.conditions_acceptees.message as string}
            </p>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={submitting}>
              {submitting ? "Envoi..." : "Soumettre la demande"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
