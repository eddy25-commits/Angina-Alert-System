"use client";

import { useFormStatus } from "react-dom";

export default function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="mt-2 w-full rounded-xl bg-hl-blue-500 py-3.5 text-base font-semibold text-white transition-colors hover:bg-hl-blue-400 disabled:opacity-60"
    >
      {pending ? "Please wait…" : children}
    </button>
  );
}
