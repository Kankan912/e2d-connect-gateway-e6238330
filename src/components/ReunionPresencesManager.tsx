import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Users, Search, UserCheck, UserX, Clock, FileDown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ExportService } from "@/lib/exportService";

interface ReunionPresencesManagerProps {
  reunionId: string;
}

export default function ReunionPresencesManager({ reunionId }: ReunionPresencesManagerProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filtreStatut, setFiltreStatut] = useState<string>("all");

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
    mutationFn: async ({ 
      membreId, 
      statutPresence, 
      heureArrivee, 
      observations 
    }: { 
      membreId: string; 
      statutPresence: string;
      heureArrivee?: string;
      observations?: string;
    }) => {
      const existingPresence = presences?.find(p => p.membre_id === membreId);

      const presenceData = {
        reunion_id: reunionId,
        membre_id: membreId,
        statut_presence: statutPresence,
        present: statutPresence === 'present',
        heure_arrivee: heureArrivee || null,
        observations: observations || null,
        date_presence: new Date().toISOString(),
      };

      if (existingPresence) {
        const { error } = await supabase
          .from('reunions_presences')
          .update(presenceData)
          .eq('id', existingPresence.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('reunions_presences')
          .insert([presenceData]);
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
        statut_presence: 'present',
        present: true,
        date_presence: new Date().toISOString(),
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

  // Marquer tous comme absents
  const markAllAbsent = useMutation({
    mutationFn: async () => {
      if (!membres) return;
      
      const updates = membres.map(membre => ({
        reunion_id: reunionId,
        membre_id: membre.id,
        statut_presence: 'absent_non_excuse',
        present: false,
        date_presence: new Date().toISOString(),
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
        description: "Tous les membres ont été marqués absents.",
      });
    },
  });

  const filteredMembres = membres?.filter(membre => {
    const nomComplet = `${membre.nom} ${membre.prenom}`.toLowerCase();
    const matchSearch = nomComplet.includes(searchTerm.toLowerCase());
    
    if (filtreStatut === 'all') return matchSearch;
    
    const presence = presences?.find(p => p.membre_id === membre.id);
    const statut = presence?.statut_presence || null;
    
    if (filtreStatut === 'present' && statut !== 'present') return false;
    if (filtreStatut === 'absent_non_excuse' && statut !== 'absent_non_excuse') return false;
    if (filtreStatut === 'absent_excuse' && statut !== 'absent_excuse') return false;
    if (filtreStatut === 'non_marque' && statut !== null) return false;
    
    return matchSearch;
  });

  const getPresence = (membreId: string) => {
    return presences?.find(p => p.membre_id === membreId);
  };

  const handleStatutChange = (membreId: string, statut: string) => {
    const presence = getPresence(membreId);
    updatePresence.mutate({
      membreId,
      statutPresence: statut,
      heureArrivee: presence?.heure_arrivee,
      observations: presence?.observations,
    });
  };

  const handleHeureChange = (membreId: string, heure: string) => {
    const presence = getPresence(membreId);
    updatePresence.mutate({
      membreId,
      statutPresence: presence?.statut_presence || 'present',
      heureArrivee: heure,
      observations: presence?.observations,
    });
  };

  const handleObservationsChange = (membreId: string, obs: string) => {
    const presence = getPresence(membreId);
    updatePresence.mutate({
      membreId,
      statutPresence: presence?.statut_presence || 'present',
      heureArrivee: presence?.heure_arrivee,
      observations: obs,
    });
  };

  const stats = {
    presents: presences?.filter(p => p.statut_presence === 'present').length || 0,
    absentsExcuses: presences?.filter(p => p.statut_presence === 'absent_excuse').length || 0,
    absentsNonExcuses: presences?.filter(p => p.statut_presence === 'absent_non_excuse').length || 0,
    total: membres?.length || 0,
  };

  const tauxPresence = stats.total > 0 
    ? ((stats.presents / stats.total) * 100).toFixed(1) 
    : '0';

  const handleExport = async (exportFormat: 'excel' | 'pdf' | 'csv') => {
    try {
      await ExportService.export({
        type: 'presences_reunion',
        format: exportFormat,
        nom: `feuille_presence_${reunionId}`,
      });
      toast({
        title: "Export réussi",
        description: `La feuille de présence a été exportée en ${exportFormat.toUpperCase()}`,
      });
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* Statistiques */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
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
              <p className="text-2xl font-bold text-orange-600">{stats.absentsExcuses}</p>
              <p className="text-xs text-muted-foreground">Abs. Excusées</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-red-600">{stats.absentsNonExcuses}</p>
              <p className="text-xs text-muted-foreground">Abs. Non Excusées</p>
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
              <p className="text-2xl font-bold text-blue-600">{tauxPresence}%</p>
              <p className="text-xs text-muted-foreground">Taux</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions rapides */}
      <div className="flex gap-2 justify-between">
        <div className="flex gap-2">
          <Button
            onClick={() => markAllPresent.mutate()}
            disabled={markAllPresent.isPending}
            variant="outline"
            size="sm"
          >
            <UserCheck className="w-4 h-4 mr-2" />
            Tous présents
          </Button>
          <Button
            onClick={() => markAllAbsent.mutate()}
            disabled={markAllAbsent.isPending}
            variant="outline"
            size="sm"
          >
            <UserX className="w-4 h-4 mr-2" />
            Tous absents
          </Button>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => handleExport('excel')}>
            <FileDown className="w-4 h-4 mr-2" />
            Excel
          </Button>
          <Button variant="outline" size="sm" onClick={() => handleExport('pdf')}>
            <FileDown className="w-4 h-4 mr-2" />
            PDF
          </Button>
        </div>
      </div>

      {/* Feuille de présence */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Feuille de Présence
            </CardTitle>
            <div className="flex gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 w-64"
                />
              </div>
              <Select value={filtreStatut} onValueChange={setFiltreStatut}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filtrer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="present">Présents</SelectItem>
                  <SelectItem value="absent_non_excuse">Absents non excusés</SelectItem>
                  <SelectItem value="absent_excuse">Absents excusés</SelectItem>
                  <SelectItem value="non_marque">Non marqués</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">N°</TableHead>
                  <TableHead>Nom du membre</TableHead>
                  <TableHead className="text-center">Statut</TableHead>
                  <TableHead className="text-center">Heure d'arrivée</TableHead>
                  <TableHead>Observations</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMembres?.map((membre, index) => {
                  const presence = getPresence(membre.id);
                  const statut = presence?.statut_presence || 'present';

                  return (
                    <TableRow key={membre.id}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell className="font-medium">
                        {membre.prenom} {membre.nom}
                      </TableCell>
                      <TableCell>
                        <RadioGroup
                          value={statut}
                          onValueChange={(value) => handleStatutChange(membre.id, value)}
                          className="flex gap-4"
                        >
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="present" id={`${membre.id}-present`} />
                            <Label htmlFor={`${membre.id}-present`} className="cursor-pointer flex items-center gap-1">
                              <UserCheck className="w-4 h-4 text-green-600" />
                              Présent
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="absent_non_excuse" id={`${membre.id}-absent`} />
                            <Label htmlFor={`${membre.id}-absent`} className="cursor-pointer flex items-center gap-1">
                              <UserX className="w-4 h-4 text-red-600" />
                              Absent
                            </Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <RadioGroupItem value="absent_excuse" id={`${membre.id}-excuse`} />
                            <Label htmlFor={`${membre.id}-excuse`} className="cursor-pointer flex items-center gap-1">
                              <UserX className="w-4 h-4 text-orange-600" />
                              Excusé
                            </Label>
                          </div>
                        </RadioGroup>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-muted-foreground" />
                          <Input
                            type="time"
                            value={presence?.heure_arrivee || ''}
                            onChange={(e) => handleHeureChange(membre.id, e.target.value)}
                            className="w-32"
                            disabled={statut !== 'present'}
                          />
                        </div>
                      </TableCell>
                      <TableCell>
                        <Textarea
                          value={presence?.observations || ''}
                          onChange={(e) => handleObservationsChange(membre.id, e.target.value)}
                          placeholder="Observations..."
                          className="min-h-[60px] text-sm"
                          rows={2}
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
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
