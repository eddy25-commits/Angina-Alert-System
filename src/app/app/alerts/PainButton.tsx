"use client";

import { useState, useTransition } from "react";
import { createAlert } from "./actions";

export default function PainButton({ partnerName }: { partnerName: string }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="w-full rounded-2xl bg-hl-alert py-6 text-center text-lg font-bold text-white shadow-sm transition-colors hover:bg-hl-alert-deep"
      >
        I&apos;m having pain
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-hl-alert/30 bg-hl-alert/5 p-5">
      <p className="text-base font-medium text-hl-ink">
        Send a pain alert to {partnerName}?
      </p>
      <p className="mt-1 text-sm text-hl-mist">
        This is not a substitute for emergency services. If this may be an
        emergency, call your local emergency number.
      </p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setError(null);
            startTransition(async () => {
              const result = await createAlert();
              // createAlert redirects on success, so reaching here means
              // it returned an error instead of redirecting.
              if (result?.error) setError(result.error);
            });
          }}
          className="flex-1 rounded-xl bg-hl-alert py-3.5 text-base font-semibold text-white disabled:opacity-60"
        >
          {pending ? "Sending…" : "Yes, send alert"}
        </button>
        <button
          type="button"
          onClick={() => setConfirming(false)}
          disabled={pending}
          className="rounded-xl px-4 py-3.5 text-base font-medium text-hl-mist"
        >
          Cancel
        </button>
      </div>
      {error && (
        <p role="alert" className="mt-3 text-sm text-hl-alert-deep">
          {error}
        </p>
      )}
    </div>
  );
}
