"use client";

import EpisodeForm from "../EpisodeForm";
import { updateEpisode } from "../actions";
import type { PainEpisode } from "@/lib/supabase/types";

export default function EditEpisodeForm({ episode }: { episode: PainEpisode }) {
  const boundAction = updateEpisode.bind(null, episode.id);

  return (
    <EpisodeForm
      action={boundAction}
      submitLabel="Save changes"
      initial={{
        severity: episode.severity,
        startedAt: episode.started_at,
        endedAt: episode.ended_at,
        notes: episode.notes,
        symptoms: episode.symptoms,
        triggers: episode.possible_triggers,
      }}
    />
  );
}
