import { describe, it, expect } from "vitest";
import { resolveCurrency, formatCurrencyForAssociation } from "./formatCurrencyDynamic";

describe("formatCurrencyDynamic", () => {
  it("fallback FCFA quand aucun token", () => {
    expect(resolveCurrency(null)).toBe("FCFA");
    expect(resolveCurrency({})).toBe("FCFA");
  });

  it("XOF normalisé en FCFA pour l'affichage", () => {
    expect(resolveCurrency({ currency_code: "XOF" })).toBe("FCFA");
    expect(formatCurrencyForAssociation(1000, { currency_code: "XOF" })).toContain("FCFA");
  });

  it("EUR et USD respectés", () => {
    expect(resolveCurrency({ currency_code: "EUR" })).toBe("EUR");
    expect(resolveCurrency({ currency_code: "USD" })).toBe("USD");
  });

  it("format FCFA sans décimale", () => {
    const out = formatCurrencyForAssociation(1234567, { currency_code: "FCFA" });
    expect(out).toContain("FCFA");
    expect(out).not.toContain(",00");
  });
});
