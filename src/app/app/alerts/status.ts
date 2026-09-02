import type { AlertStatus } from "@/lib/supabase/types";

export const STATUS_LABEL: Record<AlertStatus, string> = {
  CREATED: "Sending…",
  SENT: "Sent",
  DELIVERED: "Delivered",
  OPENED: "Seen",
  ACKNOWLEDGED: "Acknowledged",
  CANCELLED: "Cancelled",
  EXPIRED: "Expired",
  FAILED: "Failed to send",
};

export const STATUS_TONE: Record<AlertStatus, "active" | "ok" | "muted"> = {
  CREATED: "active",
  SENT: "active",
  DELIVERED: "active",
  OPENED: "active",
  ACKNOWLEDGED: "ok",
  CANCELLED: "muted",
  EXPIRED: "muted",
  FAILED: "muted",
};

export function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    hour: "numeric",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  });
}
