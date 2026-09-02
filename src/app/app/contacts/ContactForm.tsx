"use client";

import { useActionState } from "react";
import type { ContactActionState } from "./actions";
import TextField from "@/components/auth/TextField";
import SubmitButton from "@/components/auth/SubmitButton";
import FormError from "@/components/auth/FormError";

const initialState: ContactActionState = { error: null };

export default function ContactForm({
  action,
  initial,
  submitLabel,
}: {
  action: (
    prevState: ContactActionState,
    formData: FormData
  ) => Promise<ContactActionState>;
  initial?: { name: string; phone: string | null; relation: string | null; escalationOrder: number };
  submitLabel: string;
}) {
  const [state, formAction] = useActionState(action, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <TextField id="name" label="Name" type="text" defaultValue={initial?.name} required />
      <TextField
        id="phone"
        label="Phone (optional)"
        type="tel"
        defaultValue={initial?.phone ?? ""}
      />
      <TextField
        id="relation"
        label="Relationship (optional)"
        type="text"
        placeholder="e.g. Daughter, Cardiologist's office"
        defaultValue={initial?.relation ?? ""}
      />
      <TextField
        id="escalationOrder"
        label="Order to contact (1 = first)"
        type="number"
        min={1}
        defaultValue={initial?.escalationOrder ?? 1}
      />
      <FormError message={state.error} />
      <SubmitButton>{submitLabel}</SubmitButton>
    </form>
  );
}
