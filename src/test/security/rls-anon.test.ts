/**
 * RLS — suite exécutable sans compte de test (A25).
 *
 * Ces tests utilisent uniquement l'URL et la clé publique du projet (déjà
 * présentes dans l'environnement de build). Ils vérifient qu'un visiteur non
 * authentifié ne peut lire aucune donnée sensible ni aucune table enfant
 * rattachée à une association. Aucune donnée n'est écrite.
 */
import { describe, it, expect, beforeAll } from "vitest";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

const canRun = !!(SUPABASE_URL && SUPABASE_ANON_KEY);
const d = canRun ? describe : describe.skip;

/** Tables enfants durcies lors du lot 1 (plus de `USING (true)`). */
const TENANT_CHILD_TABLES = [
  "cotisations_membres",
  "cotisations_mensuelles_audit",
  "cotisations_minimales",
  "tontine_attributions",
  "beneficiaires_paiements_audit",
  "activites_membres",
  "reunions_huile_savon",
] as const;

/** Tables métier nominativement scopées par association. */
const TENANT_TABLES = [
  "membres",
  "reunions",
  "reunions_presences",
  "reunions_sanctions",
  "cotisations",
  "prets",
  "sanctions",
  "audit_logs",
] as const;

d("RLS — aucune fuite pour un visiteur non authentifié", () => {
  let anon: SupabaseClient;

  beforeAll(() => {
    anon = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  });

  for (const table of [...TENANT_CHILD_TABLES, ...TENANT_TABLES]) {
    it(`${table} : aucune ligne lisible sans connexion`, async () => {
      const { data, error } = await anon.from(table).select("*").limit(1);
      expect(error || (data ?? []).length === 0).toBeTruthy();
    });
  }
});

d("RPC réunions — refus sans connexion", () => {
  let anon: SupabaseClient;
  const FAKE_ID = "00000000-0000-0000-0000-000000000000";

  beforeAll(() => {
    anon = createClient(SUPABASE_URL!, SUPABASE_ANON_KEY!, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  });

  it("cloturer_reunion est refusée à un visiteur", async () => {
    const { error } = await anon.rpc("cloturer_reunion", { _reunion_id: FAKE_ID });
    expect(error).not.toBeNull();
  });

  it("rouvrir_reunion est refusée à un visiteur", async () => {
    const { error } = await anon.rpc("rouvrir_reunion", {
      _reunion_id: FAKE_ID,
      _supprimer_sanctions: false,
      _motif: "test",
    });
    expect(error).not.toBeNull();
  });
});
