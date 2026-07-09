import { describe, it, expect } from "vitest";
import {
  LoanService,
  CotisationService,
  AideService,
  EpargneService,
  SanctionService,
  BeneficiaireService,
} from "./index";

describe("LoanService.resolveStatus", () => {
  it("annule > tout", () => {
    expect(LoanService.resolveStatus({ montant: 1000, montantPaye: 0, annule: true })).toBe("annule");
  });
  it("rembourse quand paye ≥ du", () => {
    expect(LoanService.resolveStatus({ montant: 1000, montantPaye: 1000 })).toBe("rembourse");
  });
  it("en_retard quand échéance dépassée et reste > 0", () => {
    expect(
      LoanService.resolveStatus({
        montant: 1000,
        montantPaye: 100,
        echeance: "2020-01-01",
        today: new Date("2026-01-01"),
      }),
    ).toBe("en_retard");
  });
  it("reconduit prime partiel si échéance OK", () => {
    expect(
      LoanService.resolveStatus({
        montant: 1000,
        montantPaye: 200,
        reconductions: 1,
        echeance: "2030-01-01",
        today: new Date("2026-01-01"),
      }),
    ).toBe("reconduit");
  });
  it("partiel", () => {
    expect(LoanService.resolveStatus({ montant: 1000, montantPaye: 500 })).toBe("partiel");
  });
  it("en_cours", () => {
    expect(LoanService.resolveStatus({ montant: 1000, montantPaye: 0 })).toBe("en_cours");
  });
});

describe("LoanService.canDisburse", () => {
  it("refuse si montant > solde empruntable", () => {
    expect(LoanService.canDisburse(600_000, 500_000)).toBe(false);
  });
  it("accepte si montant ≤ solde", () => {
    expect(LoanService.canDisburse(500_000, 500_000)).toBe(true);
  });
  it("refuse montant ≤ 0", () => {
    expect(LoanService.canDisburse(0, 500_000)).toBe(false);
  });
});

describe("CotisationService", () => {
  it("resolveMontantMensuel: override actif prime", () => {
    expect(
      CotisationService.resolveMontantMensuel({
        override: { montant: 5000, actif: true },
        typeDefault: 1000,
      }),
    ).toBe(5000);
  });
  it("resolveMontantMensuel: fallback si override inactif", () => {
    expect(
      CotisationService.resolveMontantMensuel({
        override: { montant: 5000, actif: false },
        typeDefault: 1000,
      }),
    ).toBe(1000);
  });
  it("resolveMontantMensuel: 0 par défaut", () => {
    expect(CotisationService.resolveMontantMensuel({})).toBe(0);
  });
  it("filterActiveTypes", () => {
    const r = CotisationService.filterActiveTypes([
      { id: "1", nom: "A", actif: true },
      { id: "2", nom: "B", actif: false },
    ]);
    expect(r.map((t) => t.id)).toEqual(["1"]);
  });
  it("projectAnnualBrut", () => {
    expect(CotisationService.projectAnnualBrut(5000)).toBe(60000);
  });
});

describe("AideService", () => {
  it("transitions valides", () => {
    expect(AideService.canTransition("demandee", "validee")).toBe(true);
    expect(AideService.canTransition("validee", "allouee")).toBe(true);
    expect(AideService.canTransition("allouee", "payee")).toBe(true);
  });
  it("transitions invalides", () => {
    expect(AideService.canTransition("demandee", "payee")).toBe(false);
    expect(AideService.canTransition("payee", "allouee")).toBe(false);
  });
  it("isTerminal", () => {
    expect(AideService.isTerminal("payee")).toBe(true);
    expect(AideService.isTerminal("rejetee")).toBe(true);
    expect(AideService.isTerminal("demandee")).toBe(false);
  });
});

describe("EpargneService", () => {
  it("computeBenefice", () => {
    expect(EpargneService.computeBenefice(100_000, 5)).toBe(5000);
  });
  it("distributeProrata", () => {
    const r = EpargneService.distributeProrata(1000, [
      { membreId: "a", montant: 100 },
      { membreId: "b", montant: 300 },
    ]);
    expect(r).toEqual([
      { membreId: "a", part: 250 },
      { membreId: "b", part: 750 },
    ]);
  });
  it("distributeProrata avec somme 0", () => {
    const r = EpargneService.distributeProrata(1000, [{ membreId: "a", montant: 0 }]);
    expect(r[0].part).toBe(0);
  });
});

describe("SanctionService", () => {
  const tarifs = [
    { typeId: "retard", montant: 500, actif: true },
    { typeId: "absence", montant: 1000, actif: true },
    { typeId: "obsolete", montant: 9999, actif: false },
  ];
  it("findMontant ignore inactif", () => {
    expect(SanctionService.findMontant(tarifs, "obsolete")).toBe(0);
  });
  it("totalReunion cumule quantités", () => {
    expect(
      SanctionService.totalReunion(tarifs, [
        { typeId: "retard", quantite: 2 },
        { typeId: "absence" },
      ]),
    ).toBe(2000);
  });
});

describe("BeneficiaireService", () => {
  it("net = brut - sanctions", () => {
    expect(BeneficiaireService.computeMontantAnnuelNet(5000, 10_000)).toBe(50_000);
  });
  it("net jamais négatif", () => {
    expect(BeneficiaireService.computeMontantAnnuelNet(1000, 100_000)).toBe(0);
  });
});
