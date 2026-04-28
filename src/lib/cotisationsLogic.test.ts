import { describe, it, expect } from "vitest";

/**
 * Validation de la logique de résolution du montant de cotisation mensuelle.
 *
 * Règle (mémoire projet) :
 *   1. Priorité au montant dans cotisations_mensuelles_exercice (par membre+exercice).
 *   2. Fallback sur cotisations_types.montant_defaut où nom LIKE '%cotisation mensuelle%' AND obligatoire=true.
 *   3. Default 0 si rien.
 */
type Resolver = (params: {
  cotisationMensuelleExercice?: { montant: number; actif: boolean } | null;
  typeMensuelDefault?: number | null;
}) => number;

const resolveCotisationMensuelle: Resolver = ({ cotisationMensuelleExercice, typeMensuelDefault }) => {
  if (cotisationMensuelleExercice?.actif && cotisationMensuelleExercice.montant > 0) {
    return cotisationMensuelleExercice.montant;
  }
  return typeMensuelDefault ?? 0;
};

describe("Cotisations - résolution montant mensuel", () => {
  it("priorité à cotisations_mensuelles_exercice (actif)", () => {
    const m = resolveCotisationMensuelle({
      cotisationMensuelleExercice: { montant: 5000, actif: true },
      typeMensuelDefault: 1000,
    });
    expect(m).toBe(5000);
  });

  it("fallback type par défaut quand pas d'override actif", () => {
    const m = resolveCotisationMensuelle({
      cotisationMensuelleExercice: null,
      typeMensuelDefault: 2000,
    });
    expect(m).toBe(2000);
  });

  it("ignore une entrée inactive et utilise le fallback", () => {
    const m = resolveCotisationMensuelle({
      cotisationMensuelleExercice: { montant: 5000, actif: false },
      typeMensuelDefault: 1000,
    });
    expect(m).toBe(1000);
  });

  it("retourne 0 si aucune source", () => {
    const m = resolveCotisationMensuelle({
      cotisationMensuelleExercice: null,
      typeMensuelDefault: null,
    });
    expect(m).toBe(0);
  });
});

/**
 * Filtrage des types de cotisations disponibles dans un exercice :
 * exercices_cotisations_types.actif = true
 */
describe("Cotisations - filtrage des types par exercice", () => {
  type ExType = { id: string; nom: string; actif: boolean };

  const filterActiveTypes = (types: ExType[]): ExType[] => types.filter(t => t.actif);

  it("ne retourne que les types actif=true", () => {
    const result = filterActiveTypes([
      { id: "1", nom: "Cotisation mensuelle", actif: true },
      { id: "2", nom: "Cotisation événement", actif: false },
      { id: "3", nom: "Inscription", actif: true },
    ]);
    expect(result).toHaveLength(2);
    expect(result.map(t => t.id)).toEqual(["1", "3"]);
  });

  it("liste vide → vide", () => {
    expect(filterActiveTypes([])).toEqual([]);
  });
});

/**
 * Calcul bénéficiaire annuel (12 mois × cotisation mensuelle, déduction sanctions).
 */
describe("Bénéficiaires - montant annuel net", () => {
  const calcMontantNet = (mensuel: number, sanctionsImpayees: number) => {
    const brut = mensuel * 12;
    return Math.max(0, brut - sanctionsImpayees);
  };

  it("brut = mensuel × 12", () => {
    expect(calcMontantNet(5000, 0)).toBe(60000);
  });

  it("déduit les sanctions impayées", () => {
    expect(calcMontantNet(5000, 10000)).toBe(50000);
  });

  it("net jamais négatif", () => {
    expect(calcMontantNet(1000, 100000)).toBe(0);
  });
});
