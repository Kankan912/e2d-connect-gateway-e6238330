import { associationStore } from '@/stores/associationStore';

/**
 * Helpers d'injection du tenant courant dans les requêtes Supabase.
 *
 * Pour l'instant leur usage est **optionnel** : le trigger SQL
 * `default_association_id()` couvre les inserts qui n'y pensent pas.
 * Les nouveaux modules (Phoenix, provisioning, etc.) doivent l'utiliser
 * explicitement pour préparer la migration Phase 4.
 */

/**
 * Retourne l'association_id courant. Lève si aucune association active.
 * À utiliser côté client (après montage de `AssociationProvider`).
 */
export function getCurrentAssociationId(): string {
  const current = associationStore.get();
  if (!current) {
    throw new Error(
      '[tenantQuery] Aucune association active. Assurez-vous que AssociationProvider est monté et que l\'utilisateur est authentifié.'
    );
  }
  return current.id;
}

/**
 * Retourne l'association_id courant ou null si indisponible.
 * À utiliser dans les code paths tolérants (analytics, logs anonymes...).
 */
export function tryGetCurrentAssociationId(): string | null {
  return associationStore.get()?.id ?? null;
}

/**
 * Injecte `association_id` dans un payload d'insertion.
 *
 * @example
 *   await supabase.from('donations').insert(withCurrentAssociation({ montant, ... }));
 */
export function withCurrentAssociation<T extends Record<string, unknown>>(
  payload: T
): T & { association_id: string } {
  return { ...payload, association_id: getCurrentAssociationId() };
}

/**
 * Variante batch : injecte `association_id` dans chaque ligne d'un tableau.
 */
export function withCurrentAssociationMany<T extends Record<string, unknown>>(
  payloads: T[]
): Array<T & { association_id: string }> {
  const id = getCurrentAssociationId();
  return payloads.map((p) => ({ ...p, association_id: id }));
}
