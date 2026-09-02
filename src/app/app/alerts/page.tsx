import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { EmergencyAlert } from "@/lib/supabase/types";
import { STATUS_LABEL, STATUS_TONE, formatTimestamp } from "./status";

export const dynamic = "force-dynamic";

const TONE_CLASSES = {
  active: "bg-hl-alert/10 text-hl-alert-deep",
  ok: "bg-hl-ok/10 text-hl-ok",
  muted: "bg-hl-paper-dim text-hl-mist",
};

export default async function AlertsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("emergency_alerts")
    .select("*")
    .or(`sender_id.eq.${user!.id},recipient_id.eq.${user!.id}`)
    .order("created_at", { ascending: false });

  const alerts = (data ?? []) as EmergencyAlert[];

  return (
    <div>
      <Link href="/app" className="text-sm font-medium text-hl-blue-700">
        ← Back
      </Link>
      <h1 className="mt-4 font-display text-2xl font-semibold">
        Alert history
      </h1>

      {alerts.length === 0 ? (
        <p className="mt-6 text-sm leading-relaxed text-hl-mist">
          No alerts yet.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {alerts.map((alert) => (
            <li key={alert.id}>
              <Link
                href={`/app/alerts/${alert.id}`}
                className="flex items-center justify-between rounded-xl border border-hl-line bg-white px-4 py-3.5"
              >
                <div>
                  <p className="text-sm font-medium text-hl-ink">
                    {alert.sender_id === user!.id ? "You reported pain" : "Partner reported pain"}
                  </p>
                  <p className="mt-0.5 text-xs text-hl-mist">
                    {formatTimestamp(alert.created_at)}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${TONE_CLASSES[STATUS_TONE[alert.status]]}`}
                >
                  {STATUS_LABEL[alert.status]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
