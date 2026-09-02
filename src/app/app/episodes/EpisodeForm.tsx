"use client";

import { useActionState } from "react";
import type { EpisodeActionState } from "./actions";
import TextField from "@/components/auth/TextField";
import SubmitButton from "@/components/auth/SubmitButton";
import FormError from "@/components/auth/FormError";

const initialState: EpisodeActionState = { error: null };

function toLocalInputValue(iso: string | null | undefined): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EpisodeForm({
  action,
  initial,
  submitLabel,
}: {
  action: (
    prevState: EpisodeActionState,
    formData: FormData
  ) => Promise<EpisodeActionState>;
  initial?: {
    severity: number | null;
    startedAt: string;
    endedAt: string | null;
    notes: string | null;
    symptoms: string[];
    triggers: string[];
  };
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <TextField
        id="startedAt"
        label="Started"
        type="datetime-local"
        defaultValue={toLocalInputValue(initial?.startedAt) || undefined}
        required
      />
      <TextField
        id="endedAt"
        label="Ended (optional)"
        type="datetime-local"
        defaultValue={toLocalInputValue(initial?.endedAt) || undefined}
      />
      <TextField
        id="severity"
        label="Pain (1–10, optional)"
        type="number"
        min={1}
        max={10}
        defaultValue={initial?.severity ?? undefined}
      />
      <TextField
        id="symptoms"
        label="Symptoms (comma-separated)"
        type="text"
        placeholder="shortness of breath, sweating"
        defaultValue={initial?.symptoms?.join(", ")}
      />
      <TextField
        id="triggers"
        label="Possible triggers (comma-separated)"
        type="text"
        placeholder="climbing stairs, stress"
        defaultValue={initial?.triggers?.join(", ")}
      />
      <label htmlFor="notes" className="block">
        <span className="text-sm font-medium text-hl-ink/80">
          Notes (optional)
        </span>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          defaultValue={initial?.notes ?? ""}
          className="mt-1.5 w-full rounded-xl border border-hl-line bg-white px-4 py-3 text-base text-hl-ink placeholder:text-hl-mist focus:border-hl-blue-500 focus:outline-none"
        />
      </label>
      <FormError message={state.error} />
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
