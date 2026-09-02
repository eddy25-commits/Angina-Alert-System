"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { acknowledgeAlert, cancelAlert } from "./actions";

export function AcknowledgeButton({ alertId }: { alertId: string }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  return (
    <div>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            const result = await acknowledgeAlert(alertId);
            if (result?.error) setError(result.error);
            else router.refresh();
          })
        }
        className="w-full rounded-xl bg-hl-ok py-3.5 text-base font-semibold text-white disabled:opacity-60"
      >
        {pending ? "…" : "I'm awake"}
      </button>
      {error && <p className="mt-2 text-sm text-hl-alert-deep">{error}</p>}
    </div>
  );
}

export function CancelAlertButton({ alertId }: { alertId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-sm font-medium text-hl-mist"
      >
        Cancel alert
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-hl-line bg-hl-paper-dim p-4">
      <p className="text-sm text-hl-ink">
        Cancel this alert? Your trusted contact will see that it was
        cancelled.
      </p>
      <div className="mt-3 flex gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await cancelAlert(alertId);
              if (result?.error) setError(result.error);
              else router.refresh();
            })
          }
          className="rounded-lg bg-hl-alert px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {pending ? "…" : "Yes, cancel it"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          className="rounded-lg px-4 py-2 text-sm font-medium text-hl-mist"
        >
          Never mind
        </button>
      </div>
      {error && <p className="mt-2 text-sm text-hl-alert-deep">{error}</p>}
    </div>
  );
}
