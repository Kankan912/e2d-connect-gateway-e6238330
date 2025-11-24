import { useState } from "react";
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

const pretSchema = z.object({
  emprunteur_id: z.string().min(1, "Sélectionnez un emprunteur"),
  montant: z.number().positive("Le montant doit être positif"),
  taux_interet: z.number().min(0).max(100),
  echeance: z.string().min(1, "Date d'échéance requise"),
  notes: z.string().optional()
});

type PretFormData = z.infer<typeof pretSchema>;

interface PretFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export default function PretForm({ open, onClose, onSubmit, initialData }: PretFormProps) {
  const { data: membres } = useQuery({
    queryKey: ['membres-actifs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membres')
        .select('id, nom, prenom')
        .eq('statut', 'actif')
        .order('nom');
      if (error) throw error;
      return data;
    }
  });

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<PretFormData>({
    resolver: zodResolver(pretSchema),
    defaultValues: initialData || {
      taux_interet: 5,
      notes: ""
    }
  });

  const emprunteurId = watch("emprunteur_id");

  const handleFormSubmit = (data: PretFormData) => {
    onSubmit({
      ...data,
      date_pret: new Date().toISOString().split('T')[0],
      statut: 'en_cours',
      montant_paye: 0
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{initialData ? "Modifier le prêt" : "Nouveau prêt"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div>
            <Label>Emprunteur *</Label>
            <Select value={emprunteurId} onValueChange={(val) => setValue("emprunteur_id", val)}>
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
            {errors.emprunteur_id && (
              <p className="text-sm text-destructive mt-1">{errors.emprunteur_id.message}</p>
            )}
          </div>

          <div>
            <Label>Montant (€) *</Label>
            <Input
              type="number"
              step="0.01"
              {...register("montant", { valueAsNumber: true })}
            />
            {errors.montant && (
              <p className="text-sm text-destructive mt-1">{errors.montant.message}</p>
            )}
          </div>

          <div>
            <Label>Taux d'intérêt (%) *</Label>
            <Input
              type="number"
              step="0.01"
              {...register("taux_interet", { valueAsNumber: true })}
            />
            {errors.taux_interet && (
              <p className="text-sm text-destructive mt-1">{errors.taux_interet.message}</p>
            )}
          </div>

          <div>
            <Label>Date d'échéance *</Label>
            <Input type="date" {...register("echeance")} />
            {errors.echeance && (
              <p className="text-sm text-destructive mt-1">{errors.echeance.message}</p>
            )}
          </div>

          <div>
            <Label>Notes</Label>
            <Textarea {...register("notes")} rows={3} />
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
