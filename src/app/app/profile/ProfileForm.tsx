"use client";

import { useActionState } from "react";
import { updateProfile } from "./actions";
import type { AuthActionState } from "@/app/actions/auth";
import TextField from "@/components/auth/TextField";
import SubmitButton from "@/components/auth/SubmitButton";
import FormError from "@/components/auth/FormError";

const initialState: AuthActionState = { error: null };

export default function ProfileForm({
  initialDisplayName,
}: {
  initialDisplayName: string;
}) {
  const [state, formAction] = useActionState(updateProfile, initialState);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <TextField
        id="displayName"
        label="Your name"
        type="text"
        defaultValue={initialDisplayName}
        autoComplete="name"
        required
      />
      <FormError message={state.error} />
      <SubmitButton>Save</SubmitButton>
    </form>
  );
}
