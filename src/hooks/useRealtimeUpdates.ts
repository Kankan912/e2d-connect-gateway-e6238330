import { useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const POSTGRES_CHANGES: any = 'postgres_changes';

interface UseRealtimeUpdatesOptions {
  table: string;
  onUpdate: () => void;
  enabled?: boolean;
  event?: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
}

export function useRealtimeUpdates({ 
  table, 
  onUpdate, 
  enabled = true,
  event = '*'
}: UseRealtimeUpdatesOptions) {
  const callbackRef = useRef(onUpdate);
  callbackRef.current = onUpdate;

  useEffect(() => {
    if (!enabled) return;

    const channelName = `realtime-${table}-${Date.now()}`;
    
    const channel = supabase
      .channel(channelName)
      .on(
        POSTGRES_CHANGES,
        { event, schema: 'public', table },
        () => callbackRef.current()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [table, enabled, event]);
}
