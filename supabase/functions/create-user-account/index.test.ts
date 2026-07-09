import "https://deno.land/std@0.224.0/dotenv/load.ts";
import { assertEquals, assert } from "https://deno.land/std@0.224.0/assert/mod.ts";

const SUPABASE_URL = Deno.env.get("VITE_SUPABASE_URL")!;
const SUPABASE_ANON_KEY = Deno.env.get("VITE_SUPABASE_PUBLISHABLE_KEY")!;
const FN_URL = `${SUPABASE_URL}/functions/v1/create-user-account`;

async function call(init: RequestInit = {}): Promise<{ status: number; body: any }> {
  const res = await fetch(FN_URL, {
    method: "POST",
    headers: {
      apikey: SUPABASE_ANON_KEY,
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    body: init.body ?? JSON.stringify({}),
  });
  const text = await res.text();
  let body: any = null;
  try { body = JSON.parse(text); } catch { body = text; }
  return { status: res.status, body };
}

Deno.test("401 when Authorization header is missing", async () => {
  const { status, body } = await call({ body: JSON.stringify({}) });
  assertEquals(status, 401);
  assertEquals(body?.success, false);
  assertEquals(body?.code, "UNAUTHORIZED");
});

Deno.test("401 with an invalid bearer token", async () => {
  const { status, body } = await call({
    headers: { Authorization: "Bearer not-a-real-token" },
    body: JSON.stringify({}),
  });
  assertEquals(status, 401);
  assertEquals(body?.code, "UNAUTHORIZED");
});

Deno.test("401/403 when calling as anon (no session)", async () => {
  const { status, body } = await call({
    headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` },
    body: JSON.stringify({
      email: "test@example.com",
      nom: "T", prenom: "T", password: "Password1",
    }),
  });
  // Anon token has no user → UnauthorizedError expected
  assert(status === 401 || status === 403, `expected 401/403, got ${status}`);
  assertEquals(body?.success, false);
});
