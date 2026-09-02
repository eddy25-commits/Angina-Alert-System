"use client";

import { useActionState } from "react";
import type { MedicationActionState } from "./actions";
import TextField from "@/components/auth/TextField";
import SubmitButton from "@/components/auth/SubmitButton";
import FormError from "@/components/auth/FormError";

const initialState: MedicationActionState = { error: null };

export default function MedicationForm({
  action,
  initial,
  submitLabel,
  showActiveToggle = false,
}: {
  action: (
    prevState: MedicationActionState,
    formData: FormData
  ) => Promise<MedicationActionState>;
  initial?: { name: string; dose: string | null; instructions: string | null; active?: boolean };
  submitLabel: string;
  showActiveToggle?: boolean;
}) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <TextField
        id="name"
        label="Medication name"
        type="text"
        defaultValue={initial?.name}
        required
      />
      <TextField
        id="dose"
        label="Dose (as prescribed)"
        type="text"
        placeholder="e.g. 0.4mg"
        defaultValue={initial?.dose ?? ""}
      />
      <label htmlFor="instructions" className="block">
        <span className="text-sm font-medium text-hl-ink/80">
          Instructions (as prescribed)
        </span>
        <textarea
          id="instructions"
          name="instructions"
          rows={3}
          defaultValue={initial?.instructions ?? ""}
          placeholder="e.g. Place under tongue at onset of chest pain"
          className="mt-1.5 w-full rounded-xl border border-hl-line bg-white px-4 py-3 text-base text-hl-ink placeholder:text-hl-mist focus:border-hl-blue-500 focus:outline-none"
        />
      </label>
      {showActiveToggle && (
        <label className="flex items-center gap-2 text-sm text-hl-ink">
          <input
            type="checkbox"
            name="active"
            defaultChecked={initial?.active ?? true}
            className="h-4 w-4 rounded border-hl-line"
          />
          Currently taking this
        </label>
      )}
      <FormError message={state.error} />
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
