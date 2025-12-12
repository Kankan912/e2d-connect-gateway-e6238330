import { useEffect, useState } from "react";
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
import FileUploadField from "@/components/forms/FileUploadField";

const pretSchema = z.object({
  membre_id: z.string().min(1, "Sélectionnez un emprunteur"),
  montant: z.number().positive("Le montant doit être positif"),
  taux_interet: z.number().min(0).max(100),
  echeance: z.string().min(1, "Date d'échéance requise"),
  avaliste_id: z.string().optional(),
  reunion_id: z.string().optional(),
  exercice_id: z.string().optional(),
  reconductions: z.number().min(0).optional(),
  notes: z.string().optional(),
  justificatif_url: z.string().optional(),
});

type PretFormData = z.infer<typeof pretSchema>;

interface PretFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: any;
}

export default function PretForm({ open, onClose, onSubmit, initialData }: PretFormProps) {
  const [justificatifUrl, setJustificatifUrl] = useState<string | null>(null);
  
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

  const { data: reunions } = useQuery({
    queryKey: ['reunions-recentes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reunions')
        .select('id, date_reunion, ordre_du_jour')
        .order('date_reunion', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data;
    }
  });

  const { data: exercices } = useQuery({
    queryKey: ['exercices'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercices')
        .select('id, nom, statut')
        .order('date_debut', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<PretFormData>({
    resolver: zodResolver(pretSchema),
    defaultValues: {
      taux_interet: 5,
      reconductions: 0,
      notes: ""
    }
  });

  const membreId = watch("membre_id");
  const avalisteId = watch("avaliste_id");
  const reunionId = watch("reunion_id");
  const exerciceId = watch("exercice_id");
  const montant = watch("montant");
  const tauxInteret = watch("taux_interet");

  // Calculer le montant total dû
  const montantTotalDu = montant && tauxInteret 
    ? montant * (1 + tauxInteret / 100) 
    : montant || 0;

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      if (initialData) {
        reset({
          membre_id: initialData.membre_id,
          montant: initialData.montant,
          taux_interet: initialData.taux_interet || 5,
          echeance: initialData.echeance,
          avaliste_id: initialData.avaliste_id || "none",
          reunion_id: initialData.reunion_id || "none",
          exercice_id: initialData.exercice_id || "none",
          reconductions: initialData.reconductions || 0,
          notes: initialData.notes || "",
        });
        setJustificatifUrl(initialData.justificatif_url || null);
      } else {
        reset({
          taux_interet: 5,
          reconductions: 0,
          notes: "",
          avaliste_id: "none",
          reunion_id: "none",
          exercice_id: "none",
        });
        setJustificatifUrl(null);
      }
    }
  }, [open, initialData, reset]);

  const handleFormSubmit = (data: PretFormData) => {
    const montantTotal = data.montant * (1 + (data.taux_interet || 0) / 100);
    onSubmit({
      ...data,
      date_pret: initialData?.date_pret || new Date().toISOString().split('T')[0],
      statut: initialData?.statut || 'en_cours',
      montant_paye: initialData?.montant_paye || 0,
      montant_total_du: montantTotal,
      avaliste_id: data.avaliste_id === "none" ? null : data.avaliste_id,
      reunion_id: data.reunion_id === "none" ? null : data.reunion_id,
      exercice_id: data.exercice_id === "none" ? null : data.exercice_id,
      reconductions: data.reconductions || 0,
      justificatif_url: justificatifUrl,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? "Modifier le prêt" : "Nouveau prêt"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Emprunteur *</Label>
              <Select value={membreId} onValueChange={(val) => setValue("membre_id", val)}>
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
              {errors.membre_id && (
                <p className="text-sm text-destructive mt-1">{errors.membre_id.message}</p>
              )}
            </div>

            <div>
              <Label>Avaliste (Garant)</Label>
              <Select value={avalisteId || "none"} onValueChange={(val) => setValue("avaliste_id", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un garant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {membres?.filter(m => m.id !== membreId).map((m) => (
                    <SelectItem key={m.id} value={m.id}>
                      {m.nom} {m.prenom}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
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
              <Label>Montant total dû</Label>
              <Input
                type="text"
                value={`${montantTotalDu.toLocaleString()} FCFA`}
                disabled
                className="bg-muted"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Date d'échéance *</Label>
              <Input type="date" {...register("echeance")} />
              {errors.echeance && (
                <p className="text-sm text-destructive mt-1">{errors.echeance.message}</p>
              )}
            </div>

            <div>
              <Label>Nombre de reconductions</Label>
              <Input
                type="number"
                min="0"
                {...register("reconductions", { valueAsNumber: true })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Réunion d'attribution</Label>
              <Select value={reunionId || "none"} onValueChange={(val) => setValue("reunion_id", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une réunion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucune</SelectItem>
                  {reunions?.map((r) => (
                    <SelectItem key={r.id} value={r.id}>
                      {new Date(r.date_reunion).toLocaleDateString('fr-FR')} - {r.ordre_du_jour?.substring(0, 30)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Exercice fiscal</Label>
              <Select value={exerciceId || "none"} onValueChange={(val) => setValue("exercice_id", val)}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un exercice" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Aucun</SelectItem>
                  {exercices?.map((e) => (
                    <SelectItem key={e.id} value={e.id}>
                      {e.nom} {e.statut === 'actif' && '(Actif)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <FileUploadField
            label="Justificatif (optionnel)"
            value={justificatifUrl}
            onChange={setJustificatifUrl}
          />

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
