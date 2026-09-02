"use client";

import { useState } from "react";

export default function OkayButton() {
  const [shown, setShown] = useState(false);

  if (shown) {
    return (
      <p className="rounded-2xl border border-hl-line bg-hl-paper-dim py-6 text-center text-base text-hl-mist">
        Good to hear. HeartLink is here if that changes.
      </p>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setShown(true)}
      className="w-full rounded-2xl border border-hl-line bg-white py-6 text-center text-lg font-semibold text-hl-ink shadow-sm transition-colors hover:bg-hl-paper-dim"
    >
      I&apos;m okay
    </button>
  );
}
