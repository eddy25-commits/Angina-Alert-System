"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestPasswordReset, type AuthActionState } from "@/app/actions/auth";
import AuthLayout from "@/components/auth/AuthLayout";
import TextField from "@/components/auth/TextField";
import SubmitButton from "@/components/auth/SubmitButton";
import FormError from "@/components/auth/FormError";
import NotConfiguredNotice from "@/components/auth/NotConfiguredNotice";

const initialState: AuthActionState = { error: null };

export default function ResetPasswordForm({
  supabaseConfigured,
  sent,
}: {
  supabaseConfigured: boolean;
  sent: boolean;
}) {
  const [state, formAction] = useActionState(requestPasswordReset, initialState);

  return (
    <AuthLayout
      title="Reset your password"
      subtitle="We'll email you a link to set a new one."
      footer={
        <Link href="/login" className="font-medium text-hl-blue-700">
          Back to log in
        </Link>
      }
    >
      {!supabaseConfigured ? (
        <NotConfiguredNotice />
      ) : sent ? (
        <p className="rounded-lg bg-hl-ok/10 px-3 py-2.5 text-sm text-hl-ok">
          If that email has an account, a reset link is on its way.
        </p>
      ) : (
        <form action={formAction} className="space-y-4">
          <TextField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            required
          />
          <FormError message={state.error} />
          <SubmitButton>Send reset link</SubmitButton>
        </form>
      )}
    </AuthLayout>
  );
}
