"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteMedication } from "../actions";

export default function DeleteMedicationButton({ medicationId }: { medicationId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-sm font-medium text-hl-alert-deep"
      >
        Delete
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await deleteMedication(medicationId);
            router.push("/app/medications");
          })
        }
        className="rounded-lg bg-hl-alert px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "…" : "Confirm delete"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-sm font-medium text-hl-mist"
      >
        Cancel
      </button>
    </div>
  );
}
