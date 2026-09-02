"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp, type AuthActionState } from "@/app/actions/auth";
import AuthLayout from "@/components/auth/AuthLayout";
import TextField from "@/components/auth/TextField";
import SubmitButton from "@/components/auth/SubmitButton";
import FormError from "@/components/auth/FormError";
import NotConfiguredNotice from "@/components/auth/NotConfiguredNotice";

const initialState: AuthActionState = { error: null };

export default function SignUpPage({
  supabaseConfigured,
}: {
  supabaseConfigured: boolean;
}) {
  const [state, formAction] = useActionState(signUp, initialState);

  return (
    <AuthLayout
      title="Create your account"
      subtitle="You'll pair with your trusted contact after you sign up."
      footer={
        <span className="text-hl-mist">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-hl-blue-700">
            Log in
          </Link>
        </span>
      }
    >
      {!supabaseConfigured ? (
        <NotConfiguredNotice />
      ) : (
        <form action={formAction} className="space-y-4">
          <TextField
            id="displayName"
            label="Your name"
            type="text"
            autoComplete="name"
            required
          />
          <TextField
            id="email"
            label="Email"
            type="email"
            autoComplete="email"
            required
          />
          <TextField
            id="password"
            label="Password"
            type="password"
            autoComplete="new-password"
            minLength={8}
            required
          />
          <FormError message={state.error} />
          <SubmitButton>Create account</SubmitButton>
        </form>
      )}
    </AuthLayout>
  );
}
