"use client";

import MedicationForm from "../MedicationForm";
import { updateMedication } from "../actions";
import type { Medication } from "@/lib/supabase/types";

export default function EditMedicationForm({ medication }: { medication: Medication }) {
  const boundAction = updateMedication.bind(null, medication.id);
  return (
    <MedicationForm
      action={boundAction}
      submitLabel="Save changes"
      showActiveToggle
      initial={{
        name: medication.name,
        dose: medication.dose,
        instructions: medication.instructions,
        active: medication.active,
      }}
    />
  );
}
