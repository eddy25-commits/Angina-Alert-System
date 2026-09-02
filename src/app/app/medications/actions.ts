"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type MedicationActionState = {
  error: string | null;
};

export async function addMedication(
  _prevState: MedicationActionState,
  formData: FormData
): Promise<MedicationActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Your session expired. Please log in again." };

  const name = String(formData.get("name") || "").trim();
  const instructions = String(formData.get("instructions") || "").trim() || null;
  const dose = String(formData.get("dose") || "").trim() || null;

  if (!name) return { error: "Enter the medication name." };

  const { error } = await supabase.from("medications").insert({
    user_id: user.id,
    name,
    instructions,
    dose,
  });

  if (error) return { error: error.message };

  revalidatePath("/app/medications");
  redirect("/app/medications");
}

export async function updateMedication(
  medicationId: string,
  _prevState: MedicationActionState,
  formData: FormData
): Promise<MedicationActionState> {
  const supabase = await createClient();
  const name = String(formData.get("name") || "").trim();
  const instructions = String(formData.get("instructions") || "").trim() || null;
  const dose = String(formData.get("dose") || "").trim() || null;
  const active = formData.get("active") === "on";

  if (!name) return { error: "Enter the medication name." };

  const { error } = await supabase
    .from("medications")
    .update({ name, instructions, dose, active })
    .eq("id", medicationId);

  if (error) return { error: error.message };

  revalidatePath("/app/medications");
  revalidatePath(`/app/medications/${medicationId}`);
  return { error: null };
}

export async function deleteMedication(medicationId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("medications").delete().eq("id", medicationId);
  revalidatePath("/app/medications");
  return { error: error?.message ?? null };
}

export async function recordMedicationTaken(episodeId: string, medicationId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("episode_medications")
    .insert({ episode_id: episodeId, medication_id: medicationId });

  revalidatePath(`/app/episodes/${episodeId}`);
  return { error: error?.message ?? null };
}

export async function removeMedicationTaken(episodeId: string, episodeMedicationId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("episode_medications")
    .delete()
    .eq("id", episodeMedicationId);

  revalidatePath(`/app/episodes/${episodeId}`);
  return { error: error?.message ?? null };
}
