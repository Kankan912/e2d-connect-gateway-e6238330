import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { Coins, Plus, Check, Edit2, BarChart2, Loader2 } from 'lucide-react';
import { formatFCFA } from '@/lib/utils';
import CotisationCellModal from './CotisationCellModal';
import CotisationsEtatsModal from './CotisationsEtatsModal';

interface CotisationsGridViewProps {
  reunionId: string;
  exerciceId?: string;
  isEditable: boolean;
}

interface CotisationType {
  id: string;
  nom: string;
  montant_defaut: number | null;
  obligatoire: boolean;
  type_saisie: string;
}

interface Membre {
  id: string;
  nom: string;
  prenom: string;
  email: string | null;
}

interface Cotisation {
  id: string;
  membre_id: string;
  type_cotisation_id: string;
  montant: number;
  date_paiement: string;
  statut: string;
}

interface HuileSavon {
  id: string;
  reunion_id: string;
  membre_id: string;
  valide: boolean;
}

export default function CotisationsGridView({ reunionId, exerciceId, isEditable }: CotisationsGridViewProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [cellModalOpen, setCellModalOpen] = useState(false);
  const [etatsModalOpen, setEtatsModalOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ membre: Membre; type: CotisationType } | null>(null);

  // Fetch types de cotisations
  const { data: types, isLoading: loadingTypes } = useQuery({
    queryKey: ['cotisations-types-grid'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cotisations_types')
        .select('id, nom, montant_defaut, obligatoire, type_saisie')
        .order('obligatoire', { ascending: false })
        .order('nom');
      if (error) throw error;
      return data as CotisationType[];
    }
  });

  // Fetch membres E2D actifs
  const { data: membres, isLoading: loadingMembres } = useQuery({
    queryKey: ['membres-e2d-grid'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('membres')
        .select('id, nom, prenom, email')
        .eq('statut', 'actif')
        .eq('est_membre_e2d', true)
        .order('nom');
      if (error) throw error;
      return data as Membre[];
    }
  });

  // Fetch cotisations de la réunion
  const { data: cotisations, isLoading: loadingCotisations } = useQuery({
    queryKey: ['cotisations-reunion-grid', reunionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('cotisations')
        .select('id, membre_id, type_cotisation_id, montant, date_paiement, statut')
        .eq('reunion_id', reunionId);
      if (error) throw error;
      return data as Cotisation[];
    }
  });

  // Fetch validations Huile & Savon
  const { data: huileSavonData } = useQuery({
    queryKey: ['huile-savon-reunion', reunionId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('reunions_huile_savon')
        .select('*')
        .eq('reunion_id', reunionId);
      if (error) throw error;
      return data as HuileSavon[];
    }
  });

  // Fetch montants personnalisés
  const { data: cotisationsMembres } = useQuery({
    queryKey: ['cotisations-membres-config-grid', exerciceId],
    queryFn: async () => {
      let query = supabase
        .from('cotisations_membres')
        .select('membre_id, type_cotisation_id, montant_personnalise')
        .eq('actif', true);
      
      if (exerciceId) {
        query = query.eq('exercice_id', exerciceId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    }
  });

  // Mutation pour toggle Huile & Savon
  const toggleHuileSavon = useMutation({
    mutationFn: async ({ membreId, valide }: { membreId: string; valide: boolean }) => {
      // Check if record exists
      const { data: existing } = await supabase
        .from('reunions_huile_savon')
        .select('id')
        .eq('reunion_id', reunionId)
        .eq('membre_id', membreId)
        .maybeSingle();

      if (existing) {
        const { error } = await supabase
          .from('reunions_huile_savon')
          .update({ valide })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('reunions_huile_savon')
          .insert({ reunion_id: reunionId, membre_id: membreId, valide });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['huile-savon-reunion', reunionId] });
    },
    onError: (error: any) => {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const isLoading = loadingTypes || loadingMembres || loadingCotisations;

  // Helper: get cotisation for membre/type
  const getCotisation = (membreId: string, typeId: string): Cotisation | undefined => {
    return cotisations?.find(c => c.membre_id === membreId && c.type_cotisation_id === typeId);
  };

  // Helper: get montant for membre/type
  const getMontant = (membreId: string, typeId: string): number => {
    const perso = cotisationsMembres?.find(
      cm => cm.membre_id === membreId && cm.type_cotisation_id === typeId
    );
    if (perso) return perso.montant_personnalise;
    const type = types?.find(t => t.id === typeId);
    return type?.montant_defaut || 0;
  };

  // Helper: is huile savon validé
  const isHuileSavonValide = (membreId: string): boolean => {
    return huileSavonData?.some(hs => hs.membre_id === membreId && hs.valide) || false;
  };

  // Split types: standard (montant) vs checkbox
  const standardTypes = useMemo(() => types?.filter(t => t.type_saisie !== 'checkbox') || [], [types]);
  const checkboxTypes = useMemo(() => types?.filter(t => t.type_saisie === 'checkbox') || [], [types]);

  // Handle cell click for standard types
  const handleCellClick = (membre: Membre, type: CotisationType) => {
    if (!isEditable) return;
    setSelectedCell({ membre, type });
    setCellModalOpen(true);
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  // Vérifier si un exercice est sélectionné - condition obligatoire pour la saisie
  const canEdit = isEditable && !!exerciceId;

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              Cotisations
              {!isEditable && (
                <Badge variant="secondary" className="ml-2">Lecture seule</Badge>
              )}
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setEtatsModalOpen(true)}
            >
              <BarChart2 className="h-4 w-4 mr-2" />
              États
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {/* Message d'alerte si aucun exercice n'est sélectionné */}
          {isEditable && !exerciceId && (
            <div className="p-4 bg-warning/10 border border-warning/30 rounded-md m-4">
              <p className="text-sm font-medium text-warning">
                ⚠️ Veuillez sélectionner un exercice pour pouvoir saisir les cotisations.
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                La saisie des cotisations nécessite un contexte d'exercice pour assurer la traçabilité comptable.
              </p>
            </div>
          )}
          <ScrollArea className="w-full">
            <div className="min-w-max">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50">
                    <TableHead className="sticky left-0 bg-muted/50 z-10 min-w-[200px]">
                      Membre / Type
                    </TableHead>
                    {standardTypes.map(type => (
                      <TableHead key={type.id} className="text-center min-w-[140px]">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-medium">{type.nom}</span>
                          <span className="text-xs text-muted-foreground">
                            {formatFCFA(type.montant_defaut || 0)}
                          </span>
                          {type.obligatoire && (
                            <Badge variant="secondary" className="text-[10px] px-1 py-0">
                              Obligatoire
                            </Badge>
                          )}
                        </div>
                      </TableHead>
                    ))}
                    {checkboxTypes.map(type => (
                      <TableHead key={type.id} className="text-center min-w-[120px]">
                        <div className="flex flex-col items-center gap-1">
                          <span className="font-medium">{type.nom}</span>
                          <span className="text-xs text-muted-foreground">(Validation)</span>
                        </div>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {membres?.map(membre => (
                    <TableRow key={membre.id} className="hover:bg-muted/30">
                      {/* Membre column */}
                      <TableCell className="sticky left-0 bg-background z-10 border-r">
                        <div className="flex flex-col">
                          <span className="font-medium">{membre.prenom} {membre.nom}</span>
                          {membre.email && (
                            <span className="text-xs text-muted-foreground truncate max-w-[180px]">
                              {membre.email}
                            </span>
                          )}
                        </div>
                      </TableCell>
                      
                      {/* Standard type cells */}
                      {standardTypes.map(type => {
                        const cotisation = getCotisation(membre.id, type.id);
                        const montant = getMontant(membre.id, type.id);
                        const isPaid = cotisation && cotisation.statut === 'paye';
                        
                        return (
                          <TableCell 
                            key={type.id} 
                            className="text-center"
                          >
                            {isPaid ? (
                              <button
                                onClick={() => handleCellClick(membre, type)}
                                disabled={!canEdit}
                                className="w-full"
                              >
                                <Badge className="bg-success text-success-foreground hover:bg-success/90 cursor-pointer">
                                  <Check className="h-3 w-3 mr-1" />
                                  Payé
                                </Badge>
                                <div className="text-xs text-muted-foreground mt-1">
                                  {formatFCFA(cotisation.montant)}
                                </div>
                                {cotisation.date_paiement && (
                                  <div className="text-[10px] text-muted-foreground">
                                    {new Date(cotisation.date_paiement).toLocaleDateString('fr-FR')}
                                  </div>
                                )}
                              </button>
                            ) : (
                              <Button
                                variant="ghost"
                                size="sm"
                                disabled={!canEdit}
                                onClick={() => handleCellClick(membre, type)}
                                className="h-10 w-10 rounded-full border-2 border-dashed border-muted-foreground/30 hover:border-primary hover:bg-primary/10"
                              >
                                <Plus className="h-4 w-4 text-muted-foreground" />
                              </Button>
                            )}
                          </TableCell>
                        );
                      })}
                      
                      {/* Checkbox type cells (Huile & Savon) */}
                      {checkboxTypes.map(type => {
                        const isValide = isHuileSavonValide(membre.id);
                        
                        return (
                          <TableCell key={type.id} className="text-center">
                            <div className="flex justify-center">
                              <Checkbox
                                checked={isValide}
                                disabled={!canEdit || toggleHuileSavon.isPending}
                                onCheckedChange={(checked) => {
                                  toggleHuileSavon.mutate({ 
                                    membreId: membre.id, 
                                    valide: checked === true 
                                  });
                                }}
                                className="h-5 w-5"
                              />
                            </div>
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                  
                  {(!membres || membres.length === 0) && (
                    <TableRow>
                      <TableCell 
                        colSpan={(standardTypes.length || 0) + (checkboxTypes.length || 0) + 1} 
                        className="text-center py-8 text-muted-foreground"
                      >
                        Aucun membre E2D actif
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Modal saisie cotisation */}
      <CotisationCellModal
        open={cellModalOpen}
        onOpenChange={setCellModalOpen}
        reunionId={reunionId}
        exerciceId={exerciceId}
        membre={selectedCell?.membre || null}
        type={selectedCell?.type || null}
        existingCotisation={selectedCell ? getCotisation(selectedCell.membre.id, selectedCell.type.id) : undefined}
        defaultMontant={selectedCell ? getMontant(selectedCell.membre.id, selectedCell.type.id) : 0}
      />

      {/* Modal États */}
      <CotisationsEtatsModal
        open={etatsModalOpen}
        onOpenChange={setEtatsModalOpen}
        reunionId={reunionId}
        exerciceId={exerciceId}
        membres={membres || []}
        types={types || []}
        cotisations={cotisations || []}
        cotisationsMembres={cotisationsMembres || []}
      />
    </>
  );
}
