"use client";

import ContactForm from "../ContactForm";
import { updateContact } from "../actions";
import type { EmergencyContact } from "@/lib/supabase/types";

export default function EditContactForm({ contact }: { contact: EmergencyContact }) {
  const boundAction = updateContact.bind(null, contact.id);
  return (
    <ContactForm
      action={boundAction}
      submitLabel="Save changes"
      initial={{
        name: contact.name,
        phone: contact.phone,
        relation: contact.relation,
        escalationOrder: contact.escalation_order,
      }}
    />
  );
}
