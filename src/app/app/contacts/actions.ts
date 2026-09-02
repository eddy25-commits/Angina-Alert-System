"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type ContactActionState = {
  error: string | null;
};

function parseOrder(raw: FormDataEntryValue | null): number {
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 1;
}

export async function addContact(
  _prevState: ContactActionState,
  formData: FormData
): Promise<ContactActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Please log in again." };

  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim() || null;
  const relation = String(formData.get("relation") || "").trim() || null;
  const escalationOrder = parseOrder(formData.get("escalationOrder"));

  if (!name) return { error: "Enter a name." };

  const { error } = await supabase.from("emergency_contacts").insert({
    user_id: user.id,
    name,
    phone,
    relation,
    escalation_order: escalationOrder,
  });

  if (error) return { error: error.message };

  revalidatePath("/app/contacts");
  redirect("/app/contacts");
}

export async function updateContact(
  contactId: string,
  _prevState: ContactActionState,
  formData: FormData
): Promise<ContactActionState> {
  const supabase = await createClient();
  const name = String(formData.get("name") || "").trim();
  const phone = String(formData.get("phone") || "").trim() || null;
  const relation = String(formData.get("relation") || "").trim() || null;
  const escalationOrder = parseOrder(formData.get("escalationOrder"));

  if (!name) return { error: "Enter a name." };

  const { error } = await supabase
    .from("emergency_contacts")
    .update({ name, phone, relation, escalation_order: escalationOrder })
    .eq("id", contactId);

  if (error) return { error: error.message };

  revalidatePath("/app/contacts");
  revalidatePath(`/app/contacts/${contactId}`);
  return { error: null };
}

export async function deleteContact(contactId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("emergency_contacts").delete().eq("id", contactId);
  revalidatePath("/app/contacts");
  return { error: error?.message ?? null };
}
