import Link from "next/link";
import { logEpisode } from "../actions";
import EpisodeForm from "../EpisodeForm";

export default function NewEpisodePage() {
  return (
    <div>
      <Link href="/app/episodes" className="text-sm font-medium text-hl-blue-700">
        ← Back
      </Link>
      <h1 className="mt-4 font-display text-2xl font-semibold">
        Log an episode
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-hl-mist">
        For a milder episode you don&apos;t need to send an alert for.
      </p>
      <EpisodeForm action={logEpisode} submitLabel="Save episode" />
    </div>
  );
}
