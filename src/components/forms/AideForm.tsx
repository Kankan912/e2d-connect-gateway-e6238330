import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAidesTypes } from "@/hooks/useAides";

const aideSchema = z.object({
  type_aide_id: z.string().min(1, "Sélectionnez un type d'aide"),
  beneficiaire_id: z.string().min(1, "Sélectionnez un bénéficiaire"),
  montant: z.number().positive("Le montant doit être positif"),
  date_allocation: z.string().min(1, "Date d'allocation requise"),
  contexte_aide: z.string().min(1, "Contexte requis"),
  statut: z.string().min(1, "Statut requis"),
  notes: z.string().optional(),
});

type AideFormData = z.infer<typeof aideSchema>;

interface AideFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export default function AideForm({ open, onClose, onSubmit, initialData }: AideFormProps) {
  const { data: typesAide } = useAidesTypes();

  const { data: membres } = useQuery({
    queryKey: ["membres-actifs"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("membres")
        .select("id, nom, prenom")
        .eq("statut", "actif")
        .order("nom");
      if (error) throw error;
      return data;
    },
  });

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<AideFormData>({
    resolver: zodResolver(aideSchema),
    defaultValues: {
      contexte_aide: "reunion",
      statut: "alloue",
      date_allocation: new Date().toISOString().split("T")[0],
      notes: "",
    },
  });

  const typeAideId = watch("type_aide_id");
  const beneficiaireId = watch("beneficiaire_id");
  const statut = watch("statut");
  const contexte = watch("contexte_aide");

  // Auto-remplir le montant selon le type d'aide sélectionné
  useEffect(() => {
    if (typeAideId && typesAide) {
      const selectedType = typesAide.find(t => t.id === typeAideId);
      if (selectedType?.montant_defaut && !initialData) {
        setValue("montant", selectedType.montant_defaut);
      }
    }
  }, [typeAideId, typesAide, setValue, initialData]);

  // Reset form when dialog opens with initialData
  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          type_aide_id: initialData.type_aide_id,
          beneficiaire_id: initialData.beneficiaire_id,
          montant: initialData.montant,
          date_allocation: initialData.date_allocation,
          contexte_aide: initialData.contexte_aide,
          statut: initialData.statut,
          notes: initialData.notes || "",
        });
      } else {
        reset({
          contexte_aide: "reunion",
          statut: "alloue",
          date_allocation: new Date().toISOString().split("T")[0],
          notes: "",
        });
      }
    }
  }, [open, initialData, reset]);

  const handleFormSubmit = (data: AideFormData) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{initialData ? "Modifier l'aide" : "Nouvelle aide"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Type d'aide *</Label>
              <Select value={typeAideId} onValueChange={(val) => setValue("type_aide_id", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un type" />
                </SelectTrigger>
                <SelectContent>
                  {typesAide?.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.nom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.type_aide_id && (
                <p className="text-sm text-destructive mt-1">{errors.type_aide_id.message}</p>
              )}
            </div>

            <div>
              <Label>Bénéficiaire *</Label>
              <Select value={beneficiaireId} onValueChange={(val) => setValue("beneficiaire_id", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un membre" />
                </SelectTrigger>
                <SelectContent>
                  {membres?.map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nom} {m.prenom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.beneficiaire_id && (
                <p className="text-sm text-destructive mt-1">{errors.beneficiaire_id.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Montant (FCFA) *</Label>
              <Input
                type="number"
                step="1"
                {...register("montant", { valueAsNumber: true })}
              />
              {errors.montant && (
                <p className="text-sm text-destructive mt-1">{errors.montant.message}</p>
              )}
            </div>

            <div>
              <Label>Date d'allocation *</Label>
              <Input type="date" {...register("date_allocation")} />
              {errors.date_allocation && (
                <p className="text-sm text-destructive mt-1">{errors.date_allocation.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Contexte *</Label>
              <Select value={contexte} onValueChange={(val) => setValue("contexte_aide", val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="reunion">Réunion</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                  <SelectItem value="exceptionnel">Exceptionnel</SelectItem>
                </SelectContent>
              </Select>
              {errors.contexte_aide && (
                <p className="text-sm text-destructive mt-1">{errors.contexte_aide.message}</p>
              )}
            </div>

            <div>
              <Label>Statut *</Label>
              <Select value={statut} onValueChange={(val) => setValue("statut", val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="demandee">Demandée</SelectItem>
                  <SelectItem value="alloue">Allouée</SelectItem>
                  <SelectItem value="refusee">Refusée</SelectItem>
                  <SelectItem value="remboursee">Remboursée</SelectItem>
                </SelectContent>
              </Select>
              {errors.statut && (
                <p className="text-sm text-destructive mt-1">{errors.statut.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea {...register("notes")} rows={3} placeholder="Informations complémentaires..." />
          </div>

          <div className="flex gap-2 justify-end">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit">
              {initialData ? "Modifier" : "Créer"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
