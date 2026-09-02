"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import type { PairingCode, Relationship } from "@/lib/supabase/types";

export type PairingActionState = {
  error: string | null;
  code?: string;
};

export async function createPairingCode(): Promise<PairingActionState> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_pairing_code");

  if (error) {
    return { error: error.message };
  }

  const row = data as PairingCode;
  revalidatePath("/app/pair");
  return { error: null, code: row.code };
}

export async function redeemPairingCode(
  _prevState: PairingActionState,
  formData: FormData
): Promise<PairingActionState> {
  const code = String(formData.get("code") || "").trim();

  if (!code) {
    return { error: "Enter the code your partner shared with you." };
  }

  const supabase = await createClient();
  const { error } = await supabase.rpc("redeem_pairing_code", {
    input_code: code,
  });

  if (error) {
    return { error: humanizePairingError(error.message) };
  }

  revalidatePath("/app");
  revalidatePath("/app/pair");
  return { error: null };
}

export async function disconnectRelationship(relationshipId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("disconnect_relationship", {
    relationship_id: relationshipId,
  });

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app");
  revalidatePath("/app/pair");
  return { error: null };
}

function humanizePairingError(message: string): string {
  // Postgres wraps our RAISE EXCEPTION text; pass known ones through
  // as-is since we wrote them to already be user-facing.
  const known = [
    "That code is not valid",
    "That code has already been used",
    "That code has expired",
    "You can't redeem your own pairing code",
    "Already paired with a trusted contact",
    "That person is already paired with someone",
  ];
  const match = known.find((m) => message.includes(m));
  return match ?? "Couldn't pair with that code. Please try again.";
}

export async function getActiveRelationship(): Promise<{
  relationship: (Relationship & { partnerName: string }) | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { relationship: null };

  const { data } = await supabase
    .from("relationships")
    .select("*")
    .eq("status", "active")
    .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
    .maybeSingle();

  if (!data) return { relationship: null };

  const relationship = data as Relationship;
  const partnerId =
    relationship.user_a === user.id ? relationship.user_b : relationship.user_a;

  const { data: partnerProfile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", partnerId)
    .single();

  return {
    relationship: {
      ...relationship,
      partnerName: partnerProfile?.display_name || "your trusted contact",
    },
  };
}
