/**
 * AideService — tests unitaires (Phase 5.7).
 * Couvre les règles pures de transition de statut (les appels RPC sont
 * couverts par les tests d'intégration hooks).
 */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { AideService } from "./AideService";
import { DomainError } from "./types";

vi.mock("@/integrations/supabase/client", () => ({
  supabase: {
    rpc: vi.fn(async () => ({ error: null })),
    from: vi.fn(() => ({
      update: vi.fn(() => ({ eq: vi.fn(async () => ({ error: null })) })),
    })),
  },
}));

describe("AideService", () => {
  beforeEach(() => vi.clearAllMocks());

  it("autorise demandee → validee", () => {
    expect(AideService.canTransition("demandee", "validee")).toBe(true);
  });

  it("refuse demandee → payee", () => {
    expect(AideService.canTransition("demandee", "payee")).toBe(false);
  });

  it("liste les transitions suivantes pour 'validee'", () => {
    expect(AideService.nextStatuts("validee").sort()).toEqual(["allouee", "rejetee"]);
  });

  it("marque payee et rejetee comme terminaux", () => {
    expect(AideService.isTerminal("payee")).toBe(true);
    expect(AideService.isTerminal("rejetee")).toBe(true);
    expect(AideService.isTerminal("demandee")).toBe(false);
  });

  it("advanceWorkflow refuse une transition interdite avec DomainError", async () => {
    await expect(
      AideService.advanceWorkflow({ aideId: "a1", from: "payee", to: "allouee" }),
    ).rejects.toBeInstanceOf(DomainError);
  });

  it("advanceWorkflow accepte une transition valide", async () => {
    await expect(
      AideService.advanceWorkflow({ aideId: "a1", from: "demandee", to: "validee" }),
    ).resolves.toBeUndefined();
  });
});
