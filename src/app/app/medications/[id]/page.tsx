import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Medication } from "@/lib/supabase/types";
import EditMedicationForm from "./EditMedicationForm";
import DeleteMedicationButton from "./DeleteMedicationButton";

export const dynamic = "force-dynamic";

export default async function MedicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("medications")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const medication = data as Medication;

  return (
    <div>
      <div className="flex items-center justify-between">
        <Link href="/app/medications" className="text-sm font-medium text-hl-blue-700">
          ← Back
        </Link>
        <DeleteMedicationButton medicationId={medication.id} />
      </div>
      <h1 className="mt-4 font-display text-2xl font-semibold">
        {medication.name}
      </h1>
      <EditMedicationForm medication={medication} />
    </div>
  );
}
