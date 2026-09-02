"use client";

import { useActionState } from "react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { redeemPairingCode, type PairingActionState } from "../actions";
import TextField from "@/components/auth/TextField";
import SubmitButton from "@/components/auth/SubmitButton";
import FormError from "@/components/auth/FormError";

const initialState: PairingActionState = { error: null };

export default function JoinForm() {
  const [state, formAction] = useActionState(redeemPairingCode, initialState);
  const router = useRouter();

  useEffect(() => {
    if (state.error === null && state !== initialState) {
      router.push("/app/pair");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state]);

  return (
    <form action={formAction} className="mt-6 space-y-4">
      <TextField
        id="code"
        label="Pairing code"
        type="text"
        autoComplete="off"
        autoCapitalize="characters"
        maxLength={6}
        placeholder="ABCD12"
        required
        className="text-center font-display text-2xl tracking-[0.3em] uppercase"
      />
      <FormError message={state.error} />
      <SubmitButton>Connect</SubmitButton>
    </form>
  );
}
