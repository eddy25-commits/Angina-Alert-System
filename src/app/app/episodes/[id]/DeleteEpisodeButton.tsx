"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteEpisode } from "../actions";

export default function DeleteEpisodeButton({ episodeId }: { episodeId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-sm font-medium text-hl-alert-deep"
      >
        Delete episode
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-hl-line bg-hl-paper-dim p-4">
      <p className="text-sm text-hl-ink">Delete this episode? This can&apos;t be undone.</p>
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await deleteEpisode(episodeId);
              if (result.error) setError(result.error);
              else router.push("/app/episodes");
            })
          }
          className="rounded-lg bg-hl-alert px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "…" : "Yes, delete"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-lg px-4 py-2 text-sm font-medium text-hl-mist"
        >
          Cancel
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-hl-alert-deep">{error}</p>}
    </div>
  );
}
