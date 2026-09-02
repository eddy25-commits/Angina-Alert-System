import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Medication } from "@/lib/supabase/types";

export const dynamic = "force-dynamic";

export default async function MedicationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data } = await supabase
    .from("medications")
    .select("*")
    .eq("user_id", user!.id)
    .order("active", { ascending: false })
    .order("name", { ascending: true });

  const medications = (data ?? []) as Medication[];

  return (
    <div>
      <div className="flex items-center justify-between">
        <Link href="/app" className="text-sm font-medium text-hl-blue-700">
          ← Back
        </Link>
        <Link href="/app/medications/new" className="text-sm font-medium text-hl-blue-700">
          + Add
        </Link>
      </div>
      <h1 className="mt-4 font-display text-2xl font-semibold">
        Medications
      </h1>

      {medications.length === 0 ? (
        <p className="mt-6 text-sm leading-relaxed text-hl-mist">
          No medications have been added.
        </p>
      ) : (
        <ul className="mt-6 space-y-3">
          {medications.map((med) => (
            <li key={med.id}>
              <Link
                href={`/app/medications/${med.id}`}
                className="flex items-center justify-between rounded-xl border border-hl-line bg-white px-4 py-3.5"
              >
                <div>
                  <p className="text-sm font-medium text-hl-ink">{med.name}</p>
                  {med.dose && <p className="mt-0.5 text-xs text-hl-mist">{med.dose}</p>}
                </div>
                {!med.active && (
                  <span className="rounded-full bg-hl-paper-dim px-2.5 py-1 text-xs font-semibold text-hl-mist">
                    Inactive
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
