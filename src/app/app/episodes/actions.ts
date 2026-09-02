"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { parseTags, parseSeverity } from "@/lib/tags";

export type EpisodeActionState = {
  error: string | null;
};

export async function logEpisode(
  _prevState: EpisodeActionState,
  formData: FormData
): Promise<EpisodeActionState> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Your session expired. Please log in again." };

  const severity = parseSeverity(formData.get("severity"));
  const startedAtRaw = String(formData.get("startedAt") || "");
  const endedAtRaw = String(formData.get("endedAt") || "");
  const notes = String(formData.get("notes") || "").trim() || null;
  const symptoms = parseTags(String(formData.get("symptoms") || ""));
  const triggers = parseTags(String(formData.get("triggers") || ""));

  if (!startedAtRaw) {
    return { error: "When did it start?" };
  }

  const { data, error } = await supabase
    .from("pain_episodes")
    .insert({
      user_id: user.id,
      severity,
      started_at: new Date(startedAtRaw).toISOString(),
      ended_at: endedAtRaw ? new Date(endedAtRaw).toISOString() : null,
      notes,
      symptoms,
      possible_triggers: triggers,
    })
    .select("id")
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app/episodes");
  redirect(`/app/episodes/${data.id}`);
}

export async function updateEpisode(
  episodeId: string,
  _prevState: EpisodeActionState,
  formData: FormData
): Promise<EpisodeActionState> {
  const supabase = await createClient();

  const severity = parseSeverity(formData.get("severity"));
  const startedAtRaw = String(formData.get("startedAt") || "");
  const endedAtRaw = String(formData.get("endedAt") || "");
  const notes = String(formData.get("notes") || "").trim() || null;
  const symptoms = parseTags(String(formData.get("symptoms") || ""));
  const triggers = parseTags(String(formData.get("triggers") || ""));

  if (!startedAtRaw) {
    return { error: "When did it start?" };
  }

  const { error } = await supabase
    .from("pain_episodes")
    .update({
      severity,
      started_at: new Date(startedAtRaw).toISOString(),
      ended_at: endedAtRaw ? new Date(endedAtRaw).toISOString() : null,
      notes,
      symptoms,
      possible_triggers: triggers,
    })
    .eq("id", episodeId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath(`/app/episodes/${episodeId}`);
  revalidatePath("/app/episodes");
  return { error: null };
}

export async function deleteEpisode(episodeId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();

  // An episode attached to an alert is part of that alert's record —
  // deleting it would cascade-delete the alert too (FK on
  // emergency_alerts.episode_id), silently destroying alert history.
  // Block that at the app layer rather than letting it happen quietly.
  const { data: linkedAlert } = await supabase
    .from("emergency_alerts")
    .select("id")
    .eq("episode_id", episodeId)
    .maybeSingle();

  if (linkedAlert) {
    return {
      error:
        "This episode is attached to an alert and can't be deleted, to keep the alert history intact.",
    };
  }

  const { error } = await supabase.from("pain_episodes").delete().eq("id", episodeId);

  if (error) {
    return { error: error.message };
  }

  revalidatePath("/app/episodes");
  return { error: null };
}
