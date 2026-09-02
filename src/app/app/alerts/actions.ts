"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { sendAlertNotification } from "@/lib/notifications";
import { humanizeAlertError } from "@/lib/errorMessages";
import type { EmergencyAlert } from "@/lib/supabase/types";

export type AlertActionState = {
  error: string | null;
};

export async function createAlert() {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("create_alert");

  if (error) {
    return { error: humanizeAlertError(error.message) };
  }

  const alert = data as EmergencyAlert;

  // Record the REAL outcome of the push attempt — never leave the alert
  // silently stuck in CREATED, and never claim success that didn't
  // happen. mark_alert_sent only fires a state change when VAPID is
  // actually configured; if it isn't, the alert correctly stays
  // CREATED and the UI already explains that honestly.
  try {
    const { sent } = await sendAlertNotification({
      recipientUserId: alert.recipient_id,
      alertId: alert.id,
      title: "HeartLink alert",
      body: "Your trusted contact reported chest pain.",
    });
    await supabase.rpc("mark_alert_sent", {
      alert_id: alert.id,
      succeeded: sent > 0,
    });
  } catch (pushError) {
    // getVapidConfig() throws when push isn't configured at all — that's
    // not a delivery failure, just "not set up yet," so leave the alert
    // at CREATED rather than marking it FAILED.
    const notConfigured =
      pushError instanceof Error && pushError.message.includes("VAPID keys are not configured");
    if (!notConfigured) {
      console.warn("HeartLink: push notification delivery failed", pushError);
      await supabase.rpc("mark_alert_sent", { alert_id: alert.id, succeeded: false });
    }
  }

  revalidatePath("/app");
  redirect(`/app/alerts/${alert.id}`);
}

export async function acknowledgeAlert(alertId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("acknowledge_alert", {
    alert_id: alertId,
  });

  revalidatePath(`/app/alerts/${alertId}`);
  revalidatePath("/app");

  if (error) {
    return { error: humanizeAlertError(error.message) };
  }
  return { error: null };
}

export async function cancelAlert(alertId: string) {
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_alert", { alert_id: alertId });

  revalidatePath(`/app/alerts/${alertId}`);
  revalidatePath("/app");

  if (error) {
    return { error: humanizeAlertError(error.message) };
  }
  return { error: null };
}

export async function markAlertOpened(alertId: string) {
  const supabase = await createClient();
  // Best-effort — a failure here shouldn't block viewing the alert.
  await supabase.rpc("open_alert", { alert_id: alertId });
}

export async function getActiveAlertForUser(): Promise<{
  alert:
    | (EmergencyAlert & {
        role: "sender" | "recipient";
        counterpartName: string;
        severity: number | null;
      })
    | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { alert: null };

  const OPEN_STATUSES = ["CREATED", "SENT", "DELIVERED", "OPENED"];

  const { data } = await supabase
    .from("emergency_alerts")
    .select("*, pain_episodes(severity)")
    .in("status", OPEN_STATUSES)
    .or(`sender_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return { alert: null };

  const alert = data as EmergencyAlert & { pain_episodes: { severity: number | null } | null };
  const { pain_episodes, ...alertFields } = alert;
  const role: "sender" | "recipient" = alertFields.sender_id === user.id ? "sender" : "recipient";
  const counterpartId = role === "sender" ? alertFields.recipient_id : alertFields.sender_id;

  const { data: counterpart } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", counterpartId)
    .single();

  return {
    alert: {
      ...alertFields,
      role,
      counterpartName: counterpart?.display_name || "your trusted contact",
      severity: pain_episodes?.severity ?? null,
    },
  };
}
