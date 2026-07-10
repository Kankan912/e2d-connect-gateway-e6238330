/**
 * Tests unitaires de l'adaptateur Supabase du FinancialEngine (Phase 4.6).
 * Vérifient la validation client, le mapping vers la RPC `record_caisse_movement`,
 * et la gestion du snapshot vide.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";

const rpcMock = vi.fn();

vi.mock("@/integrations/supabase/client", () => ({
  supabase: { rpc: (...args: unknown[]) => rpcMock(...args) },
}));

import { CaisseService } from "./CaisseService";
import { DomainError } from "./types";

beforeEach(() => rpcMock.mockReset());

describe("CaisseService.recordMovement", () => {
  it("refuse un montant ≤ 0 sans appeler la RPC", async () => {
    await expect(
      CaisseService.recordMovement({
        type: "entree",
        montant: 0,
        categorie: "cotisation",
        libelle: "test",
      }),
    ).rejects.toBeInstanceOf(DomainError);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("refuse un type invalide", async () => {
    await expect(
      CaisseService.recordMovement({
        // @ts-expect-error test volontaire
        type: "invalide",
        montant: 100,
        categorie: "autre",
        libelle: "x",
      }),
    ).rejects.toBeInstanceOf(DomainError);
    expect(rpcMock).not.toHaveBeenCalled();
  });

  it("mappe correctement les paramètres vers la RPC", async () => {
    rpcMock.mockResolvedValueOnce({ data: "uuid-1", error: null });
    const id = await CaisseService.recordMovement({
      type: "sortie",
      montant: 5000,
      categorie: "aide",
      libelle: "Aide - Jean",
      sourceTable: "aides",
      sourceId: "src-1",
    });
    expect(id).toBe("uuid-1");
    expect(rpcMock).toHaveBeenCalledWith("record_caisse_movement", expect.objectContaining({
      p_type: "sortie",
      p_montant: 5000,
      p_categorie: "aide",
      p_source_table: "aides",
      p_source_id: "src-1",
    }));
  });

  it("propage une DomainError si la RPC échoue", async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: "boom" } });
    await expect(
      CaisseService.recordMovement({
        type: "entree",
        montant: 1,
        categorie: "autre",
        libelle: "x",
      }),
    ).rejects.toThrow("boom");
  });
});

describe("CaisseService.getSoldeEmpruntable", () => {
  it("retourne 0 quand la RPC renvoie null", async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await expect(CaisseService.getSoldeEmpruntable()).resolves.toBe(0);
  });

  it("propage l'erreur RPC comme DomainError", async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: "denied" } });
    await expect(CaisseService.getSoldeEmpruntable()).rejects.toBeInstanceOf(DomainError);
  });
});

describe("CaisseService.getSoldeSnapshot", () => {
  it("retourne null quand aucune ligne", async () => {
    rpcMock.mockResolvedValueOnce({ data: [], error: null });
    await expect(CaisseService.getSoldeSnapshot()).resolves.toBeNull();
  });

  it("retourne la première ligne d'un tableau", async () => {
    const row = { association_id: "a", solde_net: 42, total_entrees: 42, total_sorties: 0, nb_operations: 1, derniere_operation: null, refreshed_at: "now" };
    rpcMock.mockResolvedValueOnce({ data: [row], error: null });
    await expect(CaisseService.getSoldeSnapshot()).resolves.toEqual(row);
  });
});

describe("CaisseService.refreshSnapshot", () => {
  it("succès silencieux", async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: null });
    await expect(CaisseService.refreshSnapshot()).resolves.toBeUndefined();
  });
  it("propage l'erreur", async () => {
    rpcMock.mockResolvedValueOnce({ data: null, error: { message: "locked" } });
    await expect(CaisseService.refreshSnapshot()).rejects.toBeInstanceOf(DomainError);
  });
});
