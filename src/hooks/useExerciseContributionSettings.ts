import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export interface ExerciseContributionSetting {
  id: string;
  association_id: string;
  exercice_id: string;
  type_cotisation: string;
  montant: number;
  date_effet: string;
  actif: boolean;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Lit les paramètres de cotisation d'un exercice donné.
 * Source unique pour tous les calculs (voir plan Lot A audit 2026-07).
 */
export function useExerciseContributionSettings(exerciceId: string | undefined) {
  return useQuery({
    queryKey: ['exercise-contribution-settings', exerciceId],
    enabled: !!exerciceId,
    queryFn: async (): Promise<ExerciseContributionSetting[]> => {
      const { data, error } = await supabase
        .from('exercise_contribution_settings' as never)
        .select('*')
        .eq('exercice_id', exerciceId!)
        .eq('actif', true)
        .order('type_cotisation');
      if (error) throw error;
      return (data ?? []) as unknown as ExerciseContributionSetting[];
    },
  });
}

export function useUpsertExerciseContributionSetting() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<ExerciseContributionSetting> & {
      association_id: string;
      exercice_id: string;
      type_cotisation: string;
      montant: number;
    }) => {
      const { data, error } = await supabase
        .from('exercise_contribution_settings' as never)
        .upsert(payload as never, {
          onConflict: 'association_id,exercice_id,type_cotisation,date_effet',
        })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_d, vars) => {
      qc.invalidateQueries({ queryKey: ['exercise-contribution-settings', vars.exercice_id] });
      toast({ title: 'Paramètre enregistré' });
    },
    onError: (err: unknown) => {
      toast({
        title: 'Erreur',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
    },
  });
}

export function useUnlockCotisation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ cotisationId, motif }: { cotisationId: string; motif: string }) => {
      const { data, error } = await supabase.rpc('unlock_cotisation' as never, {
        _cotisation_id: cotisationId,
        _motif: motif,
      } as never);
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cotisations'] });
      toast({ title: 'Cotisation déverrouillée' });
    },
    onError: (err: unknown) => {
      toast({
        title: 'Déverrouillage refusé',
        description: err instanceof Error ? err.message : String(err),
        variant: 'destructive',
      });
    },
  });
}
