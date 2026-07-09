/**
 * Domain finance — types partagés
 *
 * Signatures pures utilisées par tous les services `src/domain/finance/*`.
 * Aucune dépendance framework — testable en isolation.
 */

export type CaisseMovementType = "entree" | "sortie";

export type CaisseCategorie =
  | "cotisation"
  | "epargne"
  | "pret_emis"
  | "pret_decaissement"
  | "pret_remboursement"
  | "aide"
  | "sanction"
  | "don"
  | "beneficiaire"
  | "distribution_beneficiaire"
  | "adhesion"
  | "interet"
  | "sport"
  | "autre"
  // Toute autre valeur libre acceptée côté RPC serveur
  | (string & {});

export interface CaisseMovementInput {
  type: CaisseMovementType;
  montant: number;
  categorie: CaisseCategorie;
  libelle: string;
  sourceTable?: string;
  sourceId?: string;
  beneficiaireId?: string;
  reunionId?: string;
  exerciceId?: string;
  dateOperation?: string;
  notes?: string;
  justificatifUrl?: string;
}

export type LoanStatut =
  | "en_cours"
  | "partiel"
  | "reconduit"
  | "en_retard"
  | "rembourse"
  | "annule";

export type AideStatut =
  | "demandee"
  | "validee"
  | "allouee"
  | "payee"
  | "rejetee";

export interface ValidationError {
  field: string;
  message: string;
}

export class DomainError extends Error {
  readonly errors: ValidationError[];
  constructor(message: string, errors: ValidationError[] = []) {
    super(message);
    this.name = "DomainError";
    this.errors = errors;
  }
}
