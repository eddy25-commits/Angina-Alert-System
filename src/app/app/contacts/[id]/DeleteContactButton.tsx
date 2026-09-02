"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteContact } from "../actions";

export default function DeleteContactButton({ contactId }: { contactId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="text-sm font-medium text-hl-alert-deep"
      >
        Delete
      </button>
    );
  }

  return (
    <div className="flex items-center gap-3">
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            await deleteContact(contactId);
            router.push("/app/contacts");
          })
        }
        className="rounded-lg bg-hl-alert px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
      >
        {pending ? "…" : "Confirm delete"}
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="text-sm font-medium text-hl-mist"
      >
        Cancel
      </button>
    </div>
  );
}
