"use client";

import { useState, useTransition } from "react";
import { createPairingCode } from "./actions";

export default function GenerateCodeButton() {
  const [pending, startTransition] = useTransition();
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function handleClick() {
    setError(null);
    startTransition(async () => {
      const result = await createPairingCode();
      if (result.error) {
        setError(result.error);
      } else {
        setCode(result.code ?? null);
      }
    });
  }

  if (code) {
    return (
      <div className="rounded-2xl border border-hl-line bg-hl-paper-dim p-6 text-center">
        <p className="text-sm text-hl-mist">Share this code with your partner</p>
        <p className="mt-3 font-display text-4xl font-bold tracking-[0.2em] text-hl-blue-700">
          {code}
        </p>
        <p className="mt-3 text-xs text-hl-mist">Expires in 15 minutes</p>
      </div>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={pending}
        className="w-full rounded-xl bg-hl-blue-500 py-3.5 text-base font-semibold text-white hover:bg-hl-blue-400 disabled:opacity-60"
      >
        {pending ? "Generating…" : "Get a pairing code"}
      </button>
      {error && (
        <p role="alert" className="mt-3 rounded-lg bg-hl-alert/10 px-3 py-2.5 text-sm text-hl-alert-deep">
          {error}
        </p>
      )}
    </div>
  );
}
