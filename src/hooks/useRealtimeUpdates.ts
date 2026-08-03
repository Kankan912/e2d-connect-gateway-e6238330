import { useEffect, useRef } from "react";
import { subscribeToTable, type RealtimeEvent } from "@/lib/realtimeChannels";

interface UseRealtimeUpdatesOptions {
  table: string;
  onUpdate: () => void;
  enabled?: boolean;
  event?: RealtimeEvent;
}

/**
 * S'abonne aux changements d'une table via le registre de canaux partagés
 * (`src/lib/realtimeChannels.ts`) : un canal unique par couple table/événement,
 * cleanup automatique au démontage du dernier abonné.
 */
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
    return subscribeToTable(table, event, () => callbackRef.current());
  }, [table, enabled, event]);
}
