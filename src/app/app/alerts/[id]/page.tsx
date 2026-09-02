import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { EmergencyAlert } from "@/lib/supabase/types";
import { STATUS_LABEL, STATUS_TONE, formatTimestamp } from "../status";
import MarkOpened from "../MarkOpened";
import { AcknowledgeButton, CancelAlertButton } from "../AlertActions";

export const dynamic = "force-dynamic";

const TONE_CLASSES = {
  active: "bg-hl-alert/10 text-hl-alert-deep",
  ok: "bg-hl-ok/10 text-hl-ok",
  muted: "bg-hl-paper-dim text-hl-mist",
};

export default async function AlertDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("emergency_alerts")
    .select("*, pain_episodes(severity, started_at)")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  const alert = data as EmergencyAlert & {
    pain_episodes: { severity: number | null; started_at: string } | null;
  };

  const isRecipient = alert.recipient_id === user!.id;
  const isSender = alert.sender_id === user!.id;
  const counterpartId = isSender ? alert.recipient_id : alert.sender_id;

  const { data: counterpart } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", counterpartId)
    .single();

  const counterpartName = counterpart?.display_name || "your trusted contact";
  const isOpenState = !["ACKNOWLEDGED", "CANCELLED", "EXPIRED"].includes(alert.status);

  return (
    <div>
      {isRecipient && <MarkOpened alertId={alert.id} />}

      <Link href="/app" className="text-sm font-medium text-hl-blue-700">
        ← Back
      </Link>

      <div className="mt-4 flex items-start justify-between">
        <h1 className="font-display text-2xl font-semibold">
          {isRecipient ? `${counterpartName} reported chest pain` : "Your alert"}
        </h1>
      </div>

      <span
        className={`mt-3 inline-block rounded-full px-3 py-1 text-sm font-semibold ${TONE_CLASSES[STATUS_TONE[alert.status]]}`}
      >
        {STATUS_LABEL[alert.status]}
      </span>

      <dl className="mt-6 space-y-3 rounded-2xl border border-hl-line bg-hl-paper-dim p-5 text-sm">
        <div className="flex justify-between">
          <dt className="text-hl-mist">Reported</dt>
          <dd className="font-medium text-hl-ink">
            {formatTimestamp(alert.pain_episodes?.started_at ?? alert.created_at)}
          </dd>
        </div>
        {alert.pain_episodes?.severity != null && (
          <div className="flex justify-between">
            <dt className="text-hl-mist">Pain</dt>
            <dd className="font-medium text-hl-ink">
              {alert.pain_episodes.severity}/10
            </dd>
          </div>
        )}
        {alert.acknowledged_at && (
          <div className="flex justify-between">
            <dt className="text-hl-mist">Acknowledged</dt>
            <dd className="font-medium text-hl-ink">
              {formatTimestamp(alert.acknowledged_at)}
            </dd>
          </div>
        )}
        {alert.cancelled_at && (
          <div className="flex justify-between">
            <dt className="text-hl-mist">Cancelled</dt>
            <dd className="font-medium text-hl-ink">
              {formatTimestamp(alert.cancelled_at)}
            </dd>
          </div>
        )}
      </dl>

      {isRecipient && isOpenState && (
        <div className="mt-6">
          <AcknowledgeButton alertId={alert.id} />
        </div>
      )}

      {isSender && isOpenState && (
        <div className="mt-6 text-center">
          <CancelAlertButton alertId={alert.id} />
        </div>
      )}

      {isSender && alert.status === "CREATED" && (
        <p className="mt-4 text-xs leading-relaxed text-hl-mist">
          Push notifications aren&apos;t turned on for this account, so{" "}
          {counterpartName} will see this the next time they open HeartLink
          — not immediately.
        </p>
      )}

      {isSender && alert.status === "FAILED" && (
        <p className="mt-4 text-sm leading-relaxed text-hl-alert-deep">
          The push notification couldn&apos;t be delivered. {counterpartName}{" "}
          may not know yet — call them directly if you can.
        </p>
      )}
    </div>
  );
}
