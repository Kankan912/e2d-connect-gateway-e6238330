import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const matchSchema = z.object({
  date_match: z.string().min(1, "Date requise"),
  adversaire: z.string().min(2, "Adversaire requis"),
  lieu: z.enum(["domicile", "exterieur"]),
  buts_marques: z.number().min(0),
  buts_encaisses: z.number().min(0),
  competition: z.string().optional(),
});

type MatchFormData = z.infer<typeof matchSchema>;

interface E2DMatchFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export default function E2DMatchForm({ open, onOpenChange, onSuccess }: E2DMatchFormProps) {
  const form = useForm<MatchFormData>({
    resolver: zodResolver(matchSchema),
    defaultValues: { date_match: "", adversaire: "", lieu: "domicile", buts_marques: 0, buts_encaisses: 0, competition: "" },
  });

  const onSubmit = async (data: MatchFormData) => {
    console.log("Match E2D:", data);
    onSuccess();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader><DialogTitle>Nouveau Match E2D</DialogTitle></DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField control={form.control} name="date_match" render={({ field }) => (<FormItem><FormLabel>Date du Match</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="adversaire" render={({ field }) => (<FormItem><FormLabel>Adversaire</FormLabel><FormControl><Input placeholder="Nom de l'équipe adverse" {...field} /></FormControl><FormMessage /></FormItem>)} />
            <FormField control={form.control} name="lieu" render={({ field }) => (<FormItem><FormLabel>Lieu</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="domicile">Domicile</SelectItem><SelectItem value="exterieur">Extérieur</SelectItem></SelectContent></Select><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-2 gap-4">
              <FormField control={form.control} name="buts_marques" render={({ field }) => (<FormItem><FormLabel>Buts Marqués</FormLabel><FormControl><Input type="number" min={0} {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>)} />
              <FormField control={form.control} name="buts_encaisses" render={({ field }) => (<FormItem><FormLabel>Buts Encaissés</FormLabel><FormControl><Input type="number" min={0} {...field} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem>)} />
            </div>
            <FormField control={form.control} name="competition" render={({ field }) => (<FormItem><FormLabel>Compétition</FormLabel><FormControl><Input placeholder="Ex: Championnat, Coupe..." {...field} /></FormControl><FormMessage /></FormItem>)} />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Annuler</Button>
              <Button type="submit">Enregistrer</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
