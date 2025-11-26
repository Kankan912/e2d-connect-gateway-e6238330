import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { syncE2DMatchToEvent, syncPhoenixMatchToEvent, syncPhoenixEntrainementToEvent } from "@/lib/sync-events";

/**
 * Hook pour synchroniser automatiquement les événements sportifs vers le site web
 * Écoute les changements dans les tables de matchs et entraînements
 */
export function useSportEventSync() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // Canal pour les matchs E2D
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
            await syncE2DMatchToEvent(matchId);
          }
          queryClient.invalidateQueries({ queryKey: ['cms_events'] });
        }
      )
      .subscribe();

    // Canal pour les matchs Phoenix
    const phoenixMatchChannel = supabase
      .channel('sport-phoenix-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sport_phoenix_matchs'
        },
        async (payload) => {
          console.log('Match Phoenix modifié:', payload);
          const matchId = (payload.new as any)?.id || (payload.old as any)?.id;
          if (matchId && payload.eventType !== 'DELETE') {
            await syncPhoenixMatchToEvent(matchId);
          }
          queryClient.invalidateQueries({ queryKey: ['cms_events'] });
        }
      )
      .subscribe();

    // Canal pour les entraînements Phoenix
    const entrainementChannel = supabase
      .channel('phoenix-entrainements-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'phoenix_entrainements'
        },
        async (payload) => {
          console.log('Entraînement modifié:', payload);
          const entrainementId = (payload.new as any)?.id || (payload.old as any)?.id;
          if (entrainementId && payload.eventType !== 'DELETE') {
            await syncPhoenixEntrainementToEvent(entrainementId);
          }
          queryClient.invalidateQueries({ queryKey: ['cms_events'] });
        }
      )
      .subscribe();

    // Nettoyage
    return () => {
      supabase.removeChannel(e2dChannel);
      supabase.removeChannel(phoenixMatchChannel);
      supabase.removeChannel(entrainementChannel);
    };
  }, [queryClient]);
}
