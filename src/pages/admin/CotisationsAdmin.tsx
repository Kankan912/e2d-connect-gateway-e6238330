import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Receipt, CalendarRange, TrendingUp } from "lucide-react";
import CotisationsCumulAnnuel from "@/components/CotisationsCumulAnnuel";
import CotisationsDetailMensuel from "@/components/CotisationsDetailMensuel";

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
            Suivi des cotisations par membre — vue cumulée et détail mensuel.
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

      <Tabs defaultValue="mensuel" className="w-full">
        <TabsList>
          <TabsTrigger value="mensuel" className="gap-2">
            <CalendarRange className="h-4 w-4" /> Détail mensuel
          </TabsTrigger>
          <TabsTrigger value="cumul" className="gap-2">
            <TrendingUp className="h-4 w-4" /> Cumul annuel
          </TabsTrigger>
        </TabsList>

        <TabsContent value="mensuel" className="mt-4">
          <CotisationsDetailMensuel exerciceId={exerciceId} />
        </TabsContent>

        <TabsContent value="cumul" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Cumul annuel par membre</CardTitle>
            </CardHeader>
            <CardContent>
              <CotisationsCumulAnnuel exerciceId={exerciceId} />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CotisationsAdmin;
