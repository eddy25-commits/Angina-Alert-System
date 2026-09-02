import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { EmergencyContact } from "@/lib/supabase/types";
import EditContactForm from "./EditContactForm";
import DeleteContactButton from "./DeleteContactButton";

export const dynamic = "force-dynamic";

export default async function ContactDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("emergency_contacts")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!data) notFound();
  const contact = data as EmergencyContact;

  return (
    <div>
      <div className="flex items-center justify-between">
        <Link href="/app/contacts" className="text-sm font-medium text-hl-blue-700">
          ← Back
        </Link>
        <DeleteContactButton contactId={contact.id} />
      </div>
      <h1 className="mt-4 font-display text-2xl font-semibold">{contact.name}</h1>
      <EditContactForm contact={contact} />
    </div>
  );
}
