import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { EmergencyAlert, PainEpisode, Medication } from "@/lib/supabase/types";
import { getActiveRelationship } from "../pair/actions";
import { STATUS_LABEL, STATUS_TONE, formatTimestamp } from "../alerts/status";

export const dynamic = "force-dynamic";

const TONE_CLASSES = {
  active: "bg-hl-alert/10 text-hl-alert-deep",
  ok: "bg-hl-ok/10 text-hl-ok",
  muted: "bg-hl-paper-dim text-hl-mist",
};

function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 24 * 60 * 60 * 1000);
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [{ relationship }, episodesResult, alertsResult, medsResult] = await Promise.all([
    getActiveRelationship(),
    supabase
      .from("pain_episodes")
      .select("*")
      .eq("user_id", user!.id)
      .order("started_at", { ascending: false }),
    supabase
      .from("emergency_alerts")
      .select("*")
      .or(`sender_id.eq.${user!.id},recipient_id.eq.${user!.id}`)
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("medications").select("*").eq("user_id", user!.id).eq("active", true),
  ]);

  const episodes = (episodesResult.data ?? []) as PainEpisode[];
  const recentAlerts = (alertsResult.data ?? []) as EmergencyAlert[];
  const activeMeds = (medsResult.data ?? []) as Medication[];

  const episodeCount = episodes.length;
  const severities = episodes.map((e) => e.severity).filter((s): s is number => s != null);
  const averagePain =
    severities.length > 0
      ? Math.round((severities.reduce((a, b) => a + b, 0) / severities.length) * 10) / 10
      : null;

  const thirtyDaysAgo = daysAgo(30);
  const recentEpisodeCount = episodes.filter(
    (e) => new Date(e.started_at) >= thirtyDaysAgo
  ).length;

  return (
    <div>
      <Link href="/app" className="text-sm font-medium text-hl-blue-700">
        ← Back
      </Link>
      <h1 className="mt-4 font-display text-2xl font-semibold">Dashboard</h1>

      <div className="mt-6 grid grid-cols-2 gap-3">
        <StatCard label="Episodes logged" value={String(episodeCount)} />
        <StatCard label="Last 30 days" value={String(recentEpisodeCount)} />
        <StatCard
          label="Average pain"
          value={averagePain != null ? `${averagePain}/10` : "—"}
        />
        <StatCard
          label="Trusted contact"
          value={relationship ? relationship.partnerName : "Not connected"}
        />
      </div>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-hl-ink">Recent alerts</h2>
          <Link href="/app/alerts" className="text-sm font-medium text-hl-blue-700">
            View all
          </Link>
        </div>
        {recentAlerts.length === 0 ? (
          <p className="mt-3 text-sm text-hl-mist">No alerts yet.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {recentAlerts.map((a) => (
              <li key={a.id} className="flex items-center justify-between text-sm">
                <span className="text-hl-ink">{formatTimestamp(a.created_at)}</span>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${TONE_CLASSES[STATUS_TONE[a.status]]}`}
                >
                  {STATUS_LABEL[a.status]}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-hl-ink">Current medications</h2>
          <Link href="/app/medications" className="text-sm font-medium text-hl-blue-700">
            Manage
          </Link>
        </div>
        {activeMeds.length === 0 ? (
          <p className="mt-3 text-sm text-hl-mist">No medications have been added.</p>
        ) : (
          <ul className="mt-3 space-y-1">
            {activeMeds.map((m) => (
              <li key={m.id} className="text-sm text-hl-ink">
                {m.name}
                {m.dose && <span className="text-hl-mist"> · {m.dose}</span>}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-hl-line bg-hl-paper-dim p-4">
      <p className="text-xs text-hl-mist">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold text-hl-ink">{value}</p>
    </div>
  );
}
