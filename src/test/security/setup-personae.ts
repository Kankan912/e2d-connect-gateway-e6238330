import { createClient, SupabaseClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string;

export const TEST_MEMBER_EMAIL = import.meta.env.VITE_TEST_MEMBER_EMAIL as string | undefined;
export const TEST_MEMBER_PASSWORD = import.meta.env.VITE_TEST_MEMBER_PASSWORD as string | undefined;
export const TEST_ADMIN_EMAIL = import.meta.env.VITE_TEST_ADMIN_EMAIL as string | undefined;
export const TEST_ADMIN_PASSWORD = import.meta.env.VITE_TEST_ADMIN_PASSWORD as string | undefined;

export const hasTestAccounts =
  !!(TEST_MEMBER_EMAIL && TEST_MEMBER_PASSWORD && TEST_ADMIN_EMAIL && TEST_ADMIN_PASSWORD);

function freshClient(): SupabaseClient {
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export function anonClient(): SupabaseClient {
  return freshClient();
}

export async function memberClient(): Promise<SupabaseClient> {
  const c = freshClient();
  const { error } = await c.auth.signInWithPassword({
    email: TEST_MEMBER_EMAIL!,
    password: TEST_MEMBER_PASSWORD!,
  });
  if (error) throw new Error(`Member sign-in failed: ${error.message}`);
  return c;
}

export async function adminClient(): Promise<SupabaseClient> {
  const c = freshClient();
  const { error } = await c.auth.signInWithPassword({
    email: TEST_ADMIN_EMAIL!,
    password: TEST_ADMIN_PASSWORD!,
  });
  if (error) throw new Error(`Admin sign-in failed: ${error.message}`);
  return c;
}
