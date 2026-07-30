/**
 * Lot Q1 — Les permissions granulaires ne doivent plus être court-circuitées
 * par le rôle `administrateur` : les droits admin sont matérialisés dans
 * `role_permissions` et chargés par AuthContext.
 */
import { describe, it, expect, vi } from "vitest";
import { renderHook } from "@testing-library/react";
import { usePermissions } from "./usePermissions";

const authState = {
  user: { id: "u1" },
  userRole: "administrateur",
  permissions: [] as Array<{ resource: string; permission: string }>,
  loading: false,
};

vi.mock("@/contexts/AuthContext", () => ({
  useAuth: () => authState,
}));

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({ toast: vi.fn() }),
}));

describe("usePermissions", () => {
  it("refuse l'accès à un administrateur sans permission explicite", () => {
    authState.userRole = "administrateur";
    authState.permissions = [];
    const { result } = renderHook(() => usePermissions());

    expect(result.current.isAdmin).toBe(true);
    expect(result.current.hasPermission("membres", "delete")).toBe(false);
    expect(result.current.canAccessResource("membres")).toBe(false);
  });

  it("autorise l'administrateur disposant de la permission en base", () => {
    authState.userRole = "administrateur";
    authState.permissions = [{ resource: "membres", permission: "delete" }];
    const { result } = renderHook(() => usePermissions());

    expect(result.current.hasPermission("membres", "delete")).toBe(true);
    expect(result.current.canAccessResource("membres")).toBe(true);
    expect(result.current.hasPermission("membres", "create")).toBe(false);
  });

  it("hasAnyPermission valide dès qu'une permission correspond", () => {
    authState.userRole = "membre";
    authState.permissions = [{ resource: "prets", permission: "read" }];
    const { result } = renderHook(() => usePermissions());

    expect(
      result.current.hasAnyPermission([
        { resource: "caisse", permission: "read" },
        { resource: "prets", permission: "read" },
      ])
    ).toBe(true);
    expect(
      result.current.hasAnyPermission([{ resource: "caisse", permission: "read" }])
    ).toBe(false);
  });
});
