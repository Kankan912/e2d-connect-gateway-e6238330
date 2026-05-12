/**
 * RLS hardening regression suite.
 *
 * These tests hit the live Supabase instance using the anon key + credentials
 * for a regular member and an admin. They assert the policies put in place
 * by the 2026-05 security pass remain enforced.
 *
 * If the test credential env vars are missing, the suite is skipped (no
 * false positives in CI). See docs/SECURITY_TESTS.md for setup.
 */
import { describe, it, expect, beforeAll } from "vitest";
import {
  hasTestAccounts,
  anonClient,
  memberClient,
  adminClient,
} from "./setup-personae";
import type { SupabaseClient } from "@supabase/supabase-js";

const d = hasTestAccounts ? describe : describe.skip;

d("RLS — sensitive PII tables (admin/secretaire only)", () => {
  let anon: SupabaseClient;
  let member: SupabaseClient;
  let admin: SupabaseClient;

  beforeAll(async () => {
    anon = anonClient();
    member = await memberClient();
    admin = await adminClient();
  });

  for (const table of ["messages_contact", "demandes_adhesion"] as const) {
    it(`${table}: anon cannot SELECT`, async () => {
      const { data, error } = await anon.from(table).select("*").limit(1);
      // Either error OR empty due to RLS — never leak rows
      expect(error || (data ?? []).length === 0).toBeTruthy();
    });
    it(`${table}: regular member cannot SELECT`, async () => {
      const { data, error } = await member.from(table).select("*").limit(1);
      expect(error || (data ?? []).length === 0).toBeTruthy();
    });
    it(`${table}: admin CAN SELECT`, async () => {
      const { error } = await admin.from(table).select("*").limit(1);
      expect(error).toBeNull();
    });
  }
});

d("RLS — CMS tables (public read, admin write)", () => {
  let anon: SupabaseClient;
  let member: SupabaseClient;
  const tables = [
    "cms_events",
    "cms_gallery",
    "cms_hero_slides",
    "cms_pages",
    "cms_sections",
    "cms_settings",
    "cms_partners",
  ] as const;

  beforeAll(async () => {
    anon = anonClient();
    member = await memberClient();
  });

  for (const table of tables) {
    it(`${table}: anon CAN SELECT`, async () => {
      const { error } = await anon.from(table).select("*").limit(1);
      expect(error).toBeNull();
    });
    it(`${table}: regular member CANNOT INSERT`, async () => {
      const { error } = await member.from(table).insert({} as never);
      expect(error).not.toBeNull();
    });
  }
});

d("RLS — fichiers_joint (no anon access)", () => {
  it("anon cannot SELECT fichiers_joint", async () => {
    const { data, error } = await anonClient()
      .from("fichiers_joint")
      .select("*")
      .limit(1);
    expect(error || (data ?? []).length === 0).toBeTruthy();
  });
});

d("RLS — sport finances (authenticated only)", () => {
  const tables = [
    "sport_e2d_depenses",
    "sport_e2d_recettes",
    "sport_phoenix_depenses",
    "sport_phoenix_recettes",
  ] as const;

  for (const table of tables) {
    it(`${table}: anon cannot SELECT`, async () => {
      const { data, error } = await anonClient()
        .from(table)
        .select("*")
        .limit(1);
      expect(error || (data ?? []).length === 0).toBeTruthy();
    });

    it(`${table}: authenticated member CAN SELECT`, async () => {
      const m = await memberClient();
      const { error } = await m.from(table).select("*").limit(1);
      expect(error).toBeNull();
    });
  }
});

d("RLS — admin-only operational tables", () => {
  const tables = [
    "audit_logs",
    "payment_configs",
    "fond_caisse_clotures",
    "adhesions",
  ] as const;

  for (const table of tables) {
    it(`${table}: anon cannot SELECT`, async () => {
      const { data, error } = await anonClient()
        .from(table)
        .select("*")
        .limit(1);
      expect(error || (data ?? []).length === 0).toBeTruthy();
    });
    it(`${table}: regular member cannot SELECT`, async () => {
      const m = await memberClient();
      const { data, error } = await m.from(table).select("*").limit(1);
      expect(error || (data ?? []).length === 0).toBeTruthy();
    });
    it(`${table}: admin CAN SELECT`, async () => {
      const a = await adminClient();
      const { error } = await a.from(table).select("*").limit(1);
      expect(error).toBeNull();
    });
  }
});
