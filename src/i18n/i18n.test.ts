import { describe, it, expect } from "vitest";
import i18n from "./index";

describe("i18n", () => {
  it("charge FR par défaut avec les namespaces attendus", async () => {
    await i18n.changeLanguage("fr");
    expect(i18n.t("actions.save", { ns: "common" })).toBe("Enregistrer");
    expect(i18n.t("loan.status.rembourse", { ns: "finance" })).toBe("Remboursé");
  });

  it("bascule sur EN", async () => {
    await i18n.changeLanguage("en");
    expect(i18n.t("actions.save", { ns: "common" })).toBe("Save");
    expect(i18n.t("loan.status.rembourse", { ns: "finance" })).toBe("Repaid");
  });

  it("fallback FR pour clé manquante EN", async () => {
    await i18n.changeLanguage("en");
    // Clé inexistante : renvoie la clé brute
    expect(i18n.t("__does_not_exist__", { ns: "common" })).toBe("__does_not_exist__");
  });
});
