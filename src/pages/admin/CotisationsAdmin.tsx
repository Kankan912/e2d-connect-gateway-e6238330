import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Receipt } from "lucide-react";
import CotisationsCumulAnnuel from "@/components/CotisationsCumulAnnuel";

const CotisationsAdmin = () => {
  const [exerciceId, setExerciceId] = useState<string | undefined>(undefined);

  const { data: exercices, isLoading } = useQuery({
    queryKey: ["exercices-all"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("exercices")
        .select("id, nom, statut, date_debut")
        .order("date_debut", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });

  return (
    <div className="p-3 sm:p-6 space-y-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
            <Receipt className="h-7 w-7 text-primary" />
            Cotisations
          </h1>
          <p className="text-muted-foreground mt-1">
            Vue d'ensemble des cotisations annuelles par membre.
          </p>
        </div>

        <div className="min-w-[220px]">
          <Select
            value={exerciceId ?? "__active__"}
            onValueChange={(v) => setExerciceId(v === "__active__" ? undefined : v)}
            disabled={isLoading}
          >
            <SelectTrigger>
              <SelectValue placeholder="Exercice" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__active__">Exercice actif</SelectItem>
              {(exercices ?? []).map((ex) => (
                <SelectItem key={ex.id} value={ex.id}>
                  {ex.nom} {ex.statut === "actif" ? "(actif)" : ""}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Cumul annuel par membre</CardTitle>
        </CardHeader>
        <CardContent>
          <CotisationsCumulAnnuel exerciceId={exerciceId} />
        </CardContent>
      </Card>
    </div>
  );
};

export default CotisationsAdmin;
