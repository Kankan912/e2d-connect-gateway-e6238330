import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { syncE2DMatchToEvent } from "@/lib/sync-events";

/**
 * Hook pour synchroniser automatiquement les matchs E2D publiés vers le site web
 * Les matchs Phoenix et entraînements restent internes (pas de synchronisation)
 */
export function useSportEventSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Canal uniquement pour les matchs E2D
    const e2dChannel = supabase
      .channel('sport-e2d-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sport_e2d_matchs'
        },
        async (payload) => {
          console.log('Match E2D modifié:', payload);
          const matchId = (payload.new as any)?.id || (payload.old as any)?.id;
          
          if (matchId && payload.eventType !== 'DELETE') {
            // La fonction syncE2DMatchToEvent gère la logique de publication
            // Elle synchronise si publie, retire du site sinon
            await syncE2DMatchToEvent(matchId);
          }
          
          queryClient.invalidateQueries({ queryKey: ['cms_events'] });
        }
      )
      .subscribe();

    // Nettoyage - uniquement le canal E2D
    return () => {
      supabase.removeChannel(e2dChannel);
    };
  }, [queryClient]);
}
