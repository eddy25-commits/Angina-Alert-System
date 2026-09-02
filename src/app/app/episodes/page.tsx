import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { PainEpisode } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function EpisodesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("pain_episodes")
    .select("*")
    .eq("user_id", user!.id)
    .order("started_at", { ascending: false });

  const episodes = (data ?? []) as PainEpisode[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <Link href="/app" className="text-sm font-medium text-hl-blue-700">
          ← Back
        </Link>
        <Link href="/app/episodes/new" className="text-sm font-medium text-hl-blue-700">
          + Log episode
        </Link>
      </div>
      <h1 className="mt-4 font-display text-2xl font-semibold">
        Your episodes
      </h1>

      {episodes.length === 0 ? (
        <p className="mt-6 text-sm leading-relaxed text-hl-mist">
          No pain episodes recorded yet.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {episodes.map((ep) => (
            <li key={ep.id}>
              <Link
                href={`/app/episodes/${ep.id}`}
                className="flex items-center justify-between rounded-xl border border-hl-line bg-white px-4 py-3.5"
              >
                <div>
                  <p className="text-sm font-medium text-hl-ink">
                    {new Date(ep.started_at).toLocaleString(undefined, {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </p>
                  {ep.symptoms.length > 0 && (
                    <p className="mt-0.5 text-xs text-hl-mist">
                      {ep.symptoms.join(", ")}
                    </p>
                  )}
                </div>
                {ep.severity != null && (
                  <span className="rounded-full bg-hl-paper-dim px-2.5 py-1 text-xs font-semibold text-hl-ink">
                    {ep.severity}/10
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
