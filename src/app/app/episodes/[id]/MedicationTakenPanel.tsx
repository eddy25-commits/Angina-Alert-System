"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { recordMedicationTaken, removeMedicationTaken } from "../../medications/actions";
import type { Medication } from "@/lib/supabase/types";

export default function MedicationTakenPanel({
  episodeId,
  medications,
  taken,
}: {
  episodeId: string;
  medications: Medication[];
  taken: { id: string; medication_id: string; taken_at: string }[];
}) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const takenIds = new Set(taken.map((t) => t.medication_id));
  const availableToLog = medications.filter((m) => m.active && !takenIds.has(m.id));

  return (
    <div className="rounded-2xl border border-hl-line bg-hl-paper-dim p-5">
      <h2 className="text-sm font-semibold text-hl-ink">Medication taken</h2>

      {taken.length === 0 ? (
        <p className="mt-2 text-sm text-hl-mist">None logged for this episode.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {taken.map((t) => {
            const med = medications.find((m) => m.id === t.medication_id);
            return (
              <li key={t.id} className="flex items-center justify-between text-sm">
                <span className="text-hl-ink">
                  {med?.name ?? "Medication"} —{" "}
                  {new Date(t.taken_at).toLocaleTimeString(undefined, {
                    hour: "numeric",
                    minute: "2-digit",
                  })}
                </span>
                <button
                  type="button"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await removeMedicationTaken(episodeId, t.id);
                      router.refresh();
                    })
                  }
                  className="text-xs font-medium text-hl-mist"
                >
                  Remove
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {availableToLog.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {availableToLog.map((med) => (
            <button
              key={med.id}
              type="button"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  await recordMedicationTaken(episodeId, med.id);
                  router.refresh();
                })
              }
              className="rounded-full border border-hl-blue-500 px-3 py-1.5 text-sm font-medium text-hl-blue-700 disabled:opacity-60"
            >
              + {med.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
