import { createClient as createSupabaseClient, type SupabaseClient } from "@supabase/supabase-js";

// This project doesn't have generated Supabase types yet (see
// src/lib/supabase/types.ts — hand-written, not codegen'd), so the
// untyped client infers `never` for .rpc()/.from() without a Database
// generic. Test code intentionally stays loosely typed here rather than
// fighting that — regenerate with `supabase gen types` and tighten this
// once the project has real generated types.
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- see note above: no generated DB types yet
type AnyClient = SupabaseClient<any, any, any>;

export function integrationEnvReady(): { ready: boolean; reason?: string } {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return { ready: false, reason: "NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY not set" };
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return {
      ready: false,
      reason:
        "SUPABASE_SERVICE_ROLE_KEY not set — needed to create pre-confirmed throwaway test accounts",
    };
  }
  return { ready: true };
}

function adminClient(): AnyClient {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

export type TestUser = {
  id: string;
  email: string;
  client: AnyClient;
};

/**
 * Creates a real, pre-confirmed throwaway account and returns a client
 * already signed in as that user — an anon-key client, exactly like the
 * app itself uses, so these tests exercise real RLS, not a service-role
 * bypass.
 */
export async function createTestUser(label: string): Promise<TestUser> {
  const admin = adminClient();
  const email = `heartlink-test-${label}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}@example.com`;
  const password = `Test-${Math.random().toString(36).slice(2, 12)}!`;

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error || !data.user) {
    throw new Error(`Failed to create test user: ${error?.message}`);
  }

  const client: AnyClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { error: signInError } = await client.auth.signInWithPassword({ email, password });
  if (signInError) {
    throw new Error(`Failed to sign in test user: ${signInError.message}`);
  }

  return { id: data.user.id, email, client };
}

export async function deleteTestUser(userId: string) {
  const admin = adminClient();
  await admin.auth.admin.deleteUser(userId);
}

/** Pairs two fresh test users together and returns the shared relationship id. */
export async function pairTestUsers(a: TestUser, b: TestUser): Promise<string> {
  const { data: codeRow, error: codeError } = await a.client.rpc("create_pairing_code");
  if (codeError || !codeRow) {
    throw new Error(`Failed to create pairing code: ${codeError?.message}`);
  }
  const { data: relationship, error: redeemError } = await b.client.rpc("redeem_pairing_code", {
    input_code: (codeRow as { code: string }).code,
  });
  if (redeemError || !relationship) {
    throw new Error(`Failed to redeem pairing code: ${redeemError?.message}`);
  }
  return (relationship as { id: string }).id;
}
