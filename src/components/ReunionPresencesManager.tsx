import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Users, Search, UserCheck, UserX } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ReunionPresencesManagerProps {
  reunionId: string;
}

export default function ReunionPresencesManager({ reunionId }: ReunionPresencesManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");

  // Charger tous les membres actifs
  const { data: membres } = useQuery({
    queryKey: ['membres-actifs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membres')
        .select('id, nom, prenom, photo_url')
        .eq('statut', 'actif')
        .order('nom');
      if (error) throw error;
      return data;
    },
  });

  // Charger les présences de la réunion
  const { data: presences } = useQuery({
    queryKey: ['reunion-presences', reunionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reunions_presences')
        .select('*')
        .eq('reunion_id', reunionId);
      if (error) throw error;
      return data;
    },
    enabled: !!reunionId,
  });

  // Mutation pour sauvegarder/mettre à jour les présences
  const updatePresence = useMutation({
    mutationFn: async ({ membreId, present }: { membreId: string; present: boolean }) => {
      const existingPresence = presences?.find(p => p.membre_id === membreId);

      if (existingPresence) {
        const { error } = await supabase
          .from('reunions_presences')
          .update({ present })
          .eq('id', existingPresence.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('reunions_presences')
          .insert([{
            reunion_id: reunionId,
            membre_id: membreId,
            present,
          }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reunion-presences', reunionId] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Marquer tous comme présents
  const markAllPresent = useMutation({
    mutationFn: async () => {
      if (!membres) return;
      
      const updates = membres.map(membre => ({
        reunion_id: reunionId,
        membre_id: membre.id,
        present: true,
      }));

      const { error } = await supabase
        .from('reunions_presences')
        .upsert(updates, { onConflict: 'reunion_id,membre_id' });
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['reunion-presences', reunionId] });
      toast({
        title: "Succès",
        description: "Tous les membres ont été marqués présents.",
      });
    },
  });

  const filteredMembres = membres?.filter(membre =>
    `${membre.nom} ${membre.prenom}`.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const isPresent = (membreId: string) => {
    return presences?.find(p => p.membre_id === membreId)?.present || false;
  };

  const handleTogglePresence = (membreId: string, currentPresence: boolean) => {
    updatePresence.mutate({ membreId, present: !currentPresence });
  };

  const stats = {
    presents: presences?.filter(p => p.present).length || 0,
    absents: presences?.filter(p => !p.present).length || 0,
    total: membres?.length || 0,
  };

  const tauxPresence = stats.total > 0 
    ? ((stats.presents / stats.total) * 100).toFixed(1) 
    : '0';

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{stats.presents}</p>
              <p className="text-xs text-muted-foreground">Présents</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.absents}</p>
              <p className="text-xs text-muted-foreground">Absents</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold">{tauxPresence}%</p>
              <p className="text-xs text-muted-foreground">Taux</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <div className="flex gap-2">
        <Button
          onClick={() => markAllPresent.mutate()}
          disabled={markAllPresent.isPending}
          variant="outline"
        >
          <UserCheck className="w-4 h-4 mr-2" />
          Marquer tous présents
        </Button>
      </div>

      {/* Liste des membres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Feuille de Présence
          </CardTitle>
          <div className="relative mt-2">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un membre..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredMembres?.map((membre) => {
              const present = isPresent(membre.id);
              return (
                <div
                  key={membre.id}
                  className={`flex items-center justify-between p-3 border rounded-lg transition-colors ${
                    present ? 'bg-green-50 dark:bg-green-950/20 border-green-200' : 'hover:bg-muted/50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={present}
                      onCheckedChange={() => handleTogglePresence(membre.id, present)}
                    />
                    <div>
                      <p className="font-medium">
                        {membre.prenom} {membre.nom}
                      </p>
                    </div>
                  </div>
                  <Badge variant={present ? 'default' : 'secondary'}>
                    {present ? (
                      <><UserCheck className="w-3 h-3 mr-1" />Présent</>
                    ) : (
                      <><UserX className="w-3 h-3 mr-1" />Absent</>
                    )}
                  </Badge>
                </div>
              );
            })}
          </div>

          {filteredMembres?.length === 0 && (
            <p className="text-center text-muted-foreground py-8">
              Aucun membre trouvé
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
