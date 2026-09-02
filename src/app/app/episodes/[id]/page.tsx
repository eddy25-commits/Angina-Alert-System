import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { PainEpisode, Medication } from "@/lib/supabase/types";
import EditEpisodeForm from "./EditEpisodeForm";
import DeleteEpisodeButton from "./DeleteEpisodeButton";
import MedicationTakenPanel from "./MedicationTakenPanel";

export const dynamic = "force-dynamic";

export default async function EpisodeDetailPage({
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
    .from("pain_episodes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();

  const episode = data as PainEpisode;
  const isOwner = episode.user_id === user!.id;

  let medications: Medication[] = [];
  let taken: { id: string; medication_id: string; taken_at: string }[] = [];

  if (isOwner) {
    const [medsResult, takenResult] = await Promise.all([
      supabase.from("medications").select("*").eq("user_id", user!.id),
      supabase
        .from("episode_medications")
        .select("id, medication_id, taken_at")
        .eq("episode_id", episode.id)
        .order("taken_at", { ascending: true }),
    ]);
    medications = (medsResult.data ?? []) as Medication[];
    taken = takenResult.data ?? [];
  }

  return (
    <div>
      <Link href="/app/episodes" className="text-sm font-medium text-hl-blue-700">
        ← Back
      </Link>
      <h1 className="mt-4 font-display text-2xl font-semibold">Episode</h1>

      {isOwner ? (
        <>
          <EditEpisodeForm episode={episode} />
          <div className="mt-6">
            {medications.length === 0 ? (
              <p className="text-sm text-hl-mist">
                No medications have been added.{" "}
                <Link href="/app/medications/new" className="font-medium text-hl-blue-700">
                  Add one
                </Link>{" "}
                to log it against this episode.
              </p>
            ) : (
              <MedicationTakenPanel
                episodeId={episode.id}
                medications={medications}
                taken={taken}
              />
            )}
          </div>
          <div className="mt-6">
            <DeleteEpisodeButton episodeId={episode.id} />
          </div>
        </>
      ) : (
        // A paired partner can see this because it's attached to an
        // alert sent to them — read-only, not theirs to edit.
        <dl className="mt-6 space-y-3 rounded-2xl border border-hl-line bg-hl-paper-dim p-5 text-sm">
          <div className="flex justify-between">
            <dt className="text-hl-mist">Started</dt>
            <dd className="font-medium text-hl-ink">
              {new Date(episode.started_at).toLocaleString()}
            </dd>
          </div>
          {episode.severity != null && (
            <div className="flex justify-between">
              <dt className="text-hl-mist">Pain</dt>
              <dd className="font-medium text-hl-ink">{episode.severity}/10</dd>
            </div>
          )}
          {episode.symptoms.length > 0 && (
            <div className="flex justify-between">
              <dt className="text-hl-mist">Symptoms</dt>
              <dd className="font-medium text-hl-ink">{episode.symptoms.join(", ")}</dd>
            </div>
          )}
        </dl>
      )}
    </div>
  );
}
