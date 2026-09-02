import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { EmergencyContact } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function ContactsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("emergency_contacts")
    .select("*")
    .eq("user_id", user!.id)
    .order("escalation_order", { ascending: true });

  const contacts = (data ?? []) as EmergencyContact[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <Link href="/app" className="text-sm font-medium text-hl-blue-700">
          ← Back
        </Link>
        <Link href="/app/contacts/new" className="text-sm font-medium text-hl-blue-700">
          + Add
        </Link>
      </div>
      <h1 className="mt-4 font-display text-2xl font-semibold">
        Emergency contacts
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-hl-mist">
        For reference during an emergency. Only your paired trusted
        contact receives a live HeartLink alert — these are shown to them
        for context while an alert is active.
      </p>

      {contacts.length === 0 ? (
        <p className="mt-6 text-sm leading-relaxed text-hl-mist">
          No emergency contacts added yet.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {contacts.map((c) => (
            <li key={c.id}>
              <Link
                href={`/app/contacts/${c.id}`}
                className="flex items-center justify-between rounded-xl border border-hl-line bg-white px-4 py-3.5"
              >
                <div>
                  <p className="text-sm font-medium text-hl-ink">{c.name}</p>
                  <p className="mt-0.5 text-xs text-hl-mist">
                    {[c.relation, c.phone].filter(Boolean).join(" · ") || "—"}
                  </p>
                </div>
                <span className="rounded-full bg-hl-paper-dim px-2.5 py-1 text-xs font-semibold text-hl-mist">
                  #{c.escalation_order}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
