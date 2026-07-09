/**
 * AideService — workflow métier des aides financières (pur).
 *
 * Transitions autorisées :
 *   demandee → validee | rejetee
 *   validee  → allouee | rejetee
 *   allouee  → payee   (déclenche l'écriture caisse via trigger existant)
 *   payee    → (terminal)
 *   rejetee  → (terminal)
 *
 * Note : la cascade caisse à `allouee` reste portée côté serveur par le trigger
 * `trg_create_caisse_on_aide_payee`. Ce service centralise uniquement la logique
 * de transition côté client (activation des boutons, validations UI).
 */
import { AideStatut } from "./types";

const TRANSITIONS: Record<AideStatut, AideStatut[]> = {
  demandee: ["validee", "rejetee"],
  validee: ["allouee", "rejetee"],
  allouee: ["payee"],
  payee: [],
  rejetee: [],
};

export const AideService = {
  canTransition(from: AideStatut, to: AideStatut): boolean {
    return TRANSITIONS[from]?.includes(to) ?? false;
  },

  nextStatuts(from: AideStatut): AideStatut[] {
    return TRANSITIONS[from] ?? [];
  },

  isTerminal(statut: AideStatut): boolean {
    return TRANSITIONS[statut]?.length === 0;
  },
};
