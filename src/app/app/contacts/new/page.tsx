import Link from "next/link";
import { addContact } from "../actions";
import ContactForm from "../ContactForm";

export default function NewContactPage() {
  return (
    <div>
      <Link href="/app/contacts" className="text-sm font-medium text-hl-blue-700">
        ← Back
      </Link>
      <h1 className="mt-4 font-display text-2xl font-semibold">
        Add a contact
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-hl-mist">
        For reference during an emergency. HeartLink doesn&apos;t call or
        text this contact — only your paired trusted contact gets a live
        alert.
      </p>
      <ContactForm action={addContact} submitLabel="Save" />
    </div>
  );
}
