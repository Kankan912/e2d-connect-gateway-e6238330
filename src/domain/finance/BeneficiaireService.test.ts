import { describe, it, expect } from "vitest";
import { BeneficiaireService } from "./BeneficiaireService";

describe("BeneficiaireService", () => {
  describe("computeMontantAnnuelNet", () => {
    it("calcule brut − sanctions", () => {
      expect(BeneficiaireService.computeMontantAnnuelNet(1000, 500)).toBe(11500);
    });
    it("plancher à 0", () => {
      expect(BeneficiaireService.computeMontantAnnuelNet(100, 5000)).toBe(0);
    });
  });

  describe("calculerDistribution (prorata temporis)", () => {
    it("répartit selon montant × jours", () => {
      const res = BeneficiaireService.calculerDistribution(
        [
          { membreId: "a", montant: 10000, jours: 365 },
          { membreId: "b", montant: 10000, jours: 180 },
        ],
        1000,
      );
      const total = res.reduce((s, r) => s + r.part, 0);
      expect(total).toBeCloseTo(1000, 2);
      // A doit toucher ~2× B (365 vs 180)
      expect(res[0].part / res[1].part).toBeCloseTo(365 / 180, 2);
    });

    it("filtre les entrées invalides", () => {
      const res = BeneficiaireService.calculerDistribution(
        [
          { membreId: "a", montant: 0, jours: 100 },
          { membreId: "b", montant: 5000, jours: 0 },
          { membreId: "c", montant: 5000, jours: 100 },
        ],
        200,
      );
      expect(res.length).toBe(1);
      expect(res[0].membreId).toBe("c");
      expect(res[0].part).toBeCloseTo(200, 2);
    });

    it("retourne 0 quand totalDistribuable ≤ 0", () => {
      const res = BeneficiaireService.calculerDistribution(
        [{ membreId: "a", montant: 1000, jours: 30 }],
        0,
      );
      expect(res[0].part).toBe(0);
    });

    it("retourne tableau vide quand pas d'entrées valides", () => {
      const res = BeneficiaireService.calculerDistribution([], 1000);
      expect(res).toEqual([]);
    });
  });
});
