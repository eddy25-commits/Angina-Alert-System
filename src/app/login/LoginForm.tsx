"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signIn, type AuthActionState } from "@/app/actions/auth";
import AuthLayout from "@/components/auth/AuthLayout";
import TextField from "@/components/auth/TextField";
import SubmitButton from "@/components/auth/SubmitButton";
import FormError from "@/components/auth/FormError";
import NotConfiguredNotice from "@/components/auth/NotConfiguredNotice";

const initialState: AuthActionState = { error: null };

export default function LoginForm({
  supabaseConfigured,
  notice,
  errorParam,
}: {
  supabaseConfigured: boolean;
  notice?: string | null;
  errorParam?: string | null;
}) {
  const [state, formAction] = useActionState(signIn, initialState);

  return (
    <AuthLayout
      title="Log in"
      subtitle="Welcome back to HeartLink."
      footer={
        <span className="text-hl-mist">
          New here?{" "}
          <Link href="/signup" className="font-medium text-hl-blue-700">
            Create an account
          </Link>
        </span>
      }
    >
      {!supabaseConfigured ? (
        <NotConfiguredNotice />
      ) : (
        <form action={formAction} className="space-y-4">
          {notice && (
            <p className="rounded-lg bg-hl-ok/10 px-3 py-2.5 text-sm text-hl-ok">
              {notice}
            </p>
          )}
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
            autoComplete="current-password"
            required
          />
          <div className="text-right">
            <Link
              href="/reset-password"
              className="text-sm font-medium text-hl-blue-700"
            >
              Forgot password?
            </Link>
          </div>
          <FormError message={state.error || errorParam || null} />
          <SubmitButton>Log in</SubmitButton>
        </form>
      )}
    </AuthLayout>
  );
}
