import Link from "next/link";
import { addMedication } from "../actions";
import MedicationForm from "../MedicationForm";

export default function NewMedicationPage() {
  return (
    <div>
      <Link href="/app/medications" className="text-sm font-medium text-hl-blue-700">
        ← Back
      </Link>
      <h1 className="mt-4 font-display text-2xl font-semibold">
        Add a medication
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-hl-mist">
        Enter this exactly as your clinician prescribed it. HeartLink
        doesn&apos;t suggest doses or instructions.
      </p>
      <MedicationForm action={addMedication} submitLabel="Save" />
    </div>
  );
}
