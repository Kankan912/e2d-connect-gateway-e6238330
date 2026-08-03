/**
 * Registre de canaux realtime partagés.
 *
 * Objectif (Lot P) : un seul canal Supabase par table, quel que soit le nombre
 * de composants abonnés. Chaque abonné incrémente un compteur de références ;
 * le canal n'est retiré que lorsque le dernier abonné se démonte.
 *
 * Évite les doublons de souscription (noms de canaux statiques réutilisés) et
 * la prolifération de canaux (`Date.now()` / `randomUUID()` par montage).
 */
import { supabase } from "@/integrations/supabase/client";
import type { RealtimeChannel } from "@supabase/supabase-js";

export type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE" | "*";

type Listener = () => void;

interface Entry {
  channel: RealtimeChannel;
  listeners: Set<Listener>;
}

const registry = new Map<string, Entry>();

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const POSTGRES_CHANGES: any = "postgres_changes";

/**
 * Abonne un callback aux changements d'une table.
 * Retourne la fonction de désabonnement (à appeler dans le cleanup du useEffect).
 */
export function subscribeToTable(
  table: string,
  event: RealtimeEvent,
  listener: Listener,
): () => void {
  const key = `${table}::${event}`;
  let entry = registry.get(key);

  if (!entry) {
    const listeners = new Set<Listener>();
    const channel = supabase
      .channel(`shared-realtime-${key}`)
      .on(POSTGRES_CHANGES, { event, schema: "public", table }, () => {
        listeners.forEach((cb) => {
          try {
            cb();
          } catch {
            /* un abonné défaillant ne doit pas casser les autres */
          }
        });
      })
      .subscribe();

    entry = { channel, listeners };
    registry.set(key, entry);
  }

  entry.listeners.add(listener);

  return () => {
    const current = registry.get(key);
    if (!current) return;
    current.listeners.delete(listener);
    if (current.listeners.size === 0) {
      supabase.removeChannel(current.channel);
      registry.delete(key);
    }
  };
}

/** Utilisé par les tests pour repartir d'un état propre. */
export function __resetRealtimeRegistry(): void {
  registry.forEach((entry) => supabase.removeChannel(entry.channel));
  registry.clear();
}
