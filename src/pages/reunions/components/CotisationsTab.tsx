import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar, Clock, Lock, Users, Coins, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import CotisationsReunionView from "@/components/CotisationsReunionView";
import CotisationsGridView from "@/components/CotisationsGridView";
import CotisationsCumulAnnuel from "@/components/CotisationsCumulAnnuel";
import type { Reunion } from "../types";

interface CotisationsTabProps {
  reunions: Reunion[];
  selectedReunion: Reunion | null;
  onSelectReunion: (r: Reunion) => void;
}

export default function CotisationsTab({ reunions, selectedReunion, onSelectReunion }: CotisationsTabProps) {
  const [selectedExercice, setSelectedExercice] = useState<string>("__init__");

  const { data: exercices } = useQuery({
    queryKey: ['exercices-cotisations-filter'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercices')
        .select('id, nom, date_debut, date_fin, statut')
        .order('date_debut', { ascending: false });
      if (error) throw error;
      return data;
    }
  });

  useEffect(() => {
    if (selectedExercice === "__init__" && exercices?.length) {
      const actif = exercices.find(e => e.statut === 'actif');
      const actifHasReunions = actif && reunions.some(r =>
        r.date_reunion >= actif.date_debut && r.date_reunion <= actif.date_fin
      );
      if (actifHasReunions) {
        setSelectedExercice(actif!.id);
      } else {
        const enCoursReunion = reunions.find(r => r.statut === 'en_cours');
        if (enCoursReunion) {
          const matchingExercice = exercices.find(e =>
            enCoursReunion.date_reunion >= e.date_debut && enCoursReunion.date_reunion <= e.date_fin
          );
          setSelectedExercice(matchingExercice?.id || actif?.id || "all");
        } else {
          setSelectedExercice(actif?.id || "all");
        }
      }
    }
  }, [exercices, selectedExercice, reunions]);

  const reunionsFiltrees = reunions.filter(r => {
    if (selectedExercice === "all") return true;
    const exercice = exercices?.find(e => e.id === selectedExercice);
    if (!exercice) return true;
    return r.date_reunion >= exercice.date_debut && r.date_reunion <= exercice.date_fin;
  });

  const getExerciceForReunion = (dateReunion: string) => {
    return exercices?.find(e => dateReunion >= e.date_debut && dateReunion <= e.date_fin);
  };

  const reunionsParMois = reunionsFiltrees.reduce((acc, r) => {
    const date = new Date(r.date_reunion);
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
    const label = date.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
    if (!acc[key]) acc[key] = { label, reunions: [] };
    acc[key].reunions.push(r);
    return acc;
  }, {} as Record<string, { label: string; reunions: Reunion[] }>);

  const currentExercice = selectedReunion ? getExerciceForReunion(selectedReunion.date_reunion) : null;

  return (
    <Tabs defaultValue="par-reunion" className="space-y-4">
      <TabsList>
        <TabsTrigger value="par-reunion">Par Réunion</TabsTrigger>
        <TabsTrigger value="cumul-annuel">Suivi Annuel</TabsTrigger>
      </TabsList>

      <TabsContent value="par-reunion">
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5" />
                <h3 className="font-semibold">Sélectionner une réunion</h3>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Exercice :</span>
                <Select value={selectedExercice} onValueChange={setSelectedExercice}>
                  <SelectTrigger className="w-48"><SelectValue placeholder="Tous les exercices" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les exercices</SelectItem>
                    {exercices?.map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.nom} {e.statut === 'actif' && '(Actif)'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {Object.keys(reunionsParMois).length > 0 ? (
              <div className="space-y-4">
                {Object.entries(reunionsParMois).map(([key, { label, reunions: reunionsMois }]) => (
                  <div key={key}>
                    <p className="text-xs font-medium text-muted-foreground mb-2 uppercase">{label}</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                      {reunionsMois.map(reunion => {
                        const isSelected = selectedReunion?.id === reunion.id;
                        return (
                          <Button key={reunion.id} variant={isSelected ? "default" : "outline"} size="sm" onClick={() => onSelectReunion(reunion)} className={`justify-start h-auto py-2 ${isSelected ? 'ring-2 ring-primary' : ''}`}>
                            <div className="flex flex-col items-start w-full">
                              <div className="flex items-center gap-1 w-full">
                                <Calendar className="w-3 h-3 flex-shrink-0" />
                                <span className="font-medium">{new Date(reunion.date_reunion).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                                {reunion.statut === 'terminee' && <Lock className="w-3 h-3 ml-auto text-success" />}
                                {reunion.statut === 'planifie' && <Clock className="w-3 h-3 ml-auto text-muted-foreground" />}
                                {reunion.statut === 'en_cours' && <Users className="w-3 h-3 ml-auto text-warning" />}
                              </div>
                              <span className="text-[10px] text-muted-foreground truncate w-full text-left">
                                {reunion.statut === 'terminee' ? 'Clôturée' : reunion.statut === 'planifie' ? 'Planifiée' : reunion.statut === 'en_cours' ? 'En cours' : reunion.statut}
                              </span>
                            </div>
                          </Button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">Aucune réunion pour cet exercice</p>
            )}
          </CardContent>
        </Card>

        {selectedReunion && (
          <div className={`mb-4 p-3 rounded-lg text-sm ${
            selectedReunion.statut === 'terminee' ? 'bg-success/10 text-success border border-success/30'
              : selectedReunion.statut === 'en_cours' ? 'bg-warning/10 text-warning border border-warning/30'
              : 'bg-primary/10 text-primary border border-primary/30'
          }`}>
            {selectedReunion.statut === 'terminee' && <p className="flex items-center gap-2"><Lock className="w-4 h-4" /><span>Réunion clôturée - Vue en lecture seule avec comparaison attendu/payé</span></p>}
            {selectedReunion.statut === 'planifie' && <p className="flex items-center gap-2"><TrendingUp className="w-4 h-4" /><span>Réunion planifiée - Projection des cotisations attendues + saisie possible</span></p>}
            {selectedReunion.statut === 'en_cours' && <p className="flex items-center gap-2"><Users className="w-4 h-4" /><span>Réunion en cours - Saisie des cotisations activée</span></p>}
          </div>
        )}

        {selectedReunion ? (
          selectedReunion.statut === 'terminee' ? (
            <CotisationsReunionView reunionId={selectedReunion.id} reunionStatut={selectedReunion.statut} reunionDate={selectedReunion.date_reunion} exerciceId={currentExercice?.id} />
          ) : (
            <CotisationsGridView reunionId={selectedReunion.id} exerciceId={currentExercice?.id} isEditable={selectedReunion.statut === 'planifie' || selectedReunion.statut === 'en_cours'} />
          )
        ) : (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <Coins className="w-12 h-12 mx-auto mb-2 opacity-50" />
              <p>Sélectionnez une réunion pour voir les cotisations</p>
              <p className="text-sm mt-2">• Réunion planifiée = projection des montants attendus<br/>• Réunion terminée = bilan comparatif attendu/payé</p>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="cumul-annuel">
        <CotisationsCumulAnnuel />
      </TabsContent>
    </Tabs>
  );
}
