"use client";

import { useActionState } from "react";
import { updatePassword, type AuthActionState } from "@/app/actions/auth";
import AuthLayout from "@/components/auth/AuthLayout";
import TextField from "@/components/auth/TextField";
import SubmitButton from "@/components/auth/SubmitButton";
import FormError from "@/components/auth/FormError";

const initialState: AuthActionState = { error: null };

export default function UpdatePasswordForm() {
  const [state, formAction] = useActionState(updatePassword, initialState);

  return (
    <AuthLayout title="Set a new password">
      <form action={formAction} className="space-y-4">
        <TextField
          id="password"
          label="New password"
          type="password"
          autoComplete="new-password"
          minLength={8}
          required
        />
        <FormError message={state.error} />
        <SubmitButton>Update password</SubmitButton>
      </form>
    </AuthLayout>
  );
}
