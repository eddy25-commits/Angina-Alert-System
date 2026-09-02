"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { disconnectRelationship } from "./actions";

export default function DisconnectButton({
  relationshipId,
}: {
  relationshipId: string;
}) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-sm font-medium text-hl-alert-deep"
      >
        Disconnect
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-hl-line bg-hl-paper-dim p-4">
      <p className="text-sm text-hl-ink">
        Disconnect from your trusted contact? You&apos;ll both need a new
        pairing code to reconnect.
      </p>
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          onClick={() =>
            startTransition(async () => {
              const result = await disconnectRelationship(relationshipId);
              if (result?.error) {
                setError(result.error);
              } else {
                router.refresh();
              }
            })
          }
          disabled={pending}
          className="rounded-lg bg-hl-alert px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Disconnecting…" : "Yes, disconnect"}
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
