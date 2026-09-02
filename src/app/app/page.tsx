import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getActiveRelationship } from "./pair/actions";
import { getActiveAlertForUser } from "./alerts/actions";
import { STATUS_LABEL, STATUS_TONE } from "./alerts/status";
import PainButton from "./alerts/PainButton";
import OkayButton from "./alerts/OkayButton";

export const dynamic = "force-dynamic";

const TONE_CLASSES = {
  active: "bg-hl-alert/10 text-hl-alert-deep",
  ok: "bg-hl-ok/10 text-hl-ok",
  muted: "bg-hl-paper-dim text-hl-mist",
};

export default async function AppHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user!.id)
    .single();

  const { relationship } = await getActiveRelationship();
  const { alert } = relationship ? await getActiveAlertForUser() : { alert: null };

  const name = profile?.display_name?.trim();

  return (
    <div>
      <div className="flex items-baseline justify-between">
        <h1 className="font-display text-2xl font-semibold">
          {name ? `Hi, ${name}` : "You're signed in"}
        </h1>
        <div className="flex gap-4">
          <Link href="/app/dashboard" className="text-sm font-medium text-hl-blue-700">
            Dashboard
          </Link>
          <Link href="/app/alerts" className="text-sm font-medium text-hl-blue-700">
            History
          </Link>
        </div>
      </div>

      {!relationship ? (
        <div className="mt-8 rounded-2xl border border-hl-line bg-hl-paper-dim p-5">
          <h2 className="text-sm font-semibold text-hl-ink">What&apos;s next</h2>
          <p className="mt-2 text-sm leading-relaxed text-hl-mist">
            You haven&apos;t connected with a trusted contact yet. You&apos;ll
            need that connection before you can send or receive alerts.
          </p>
          <Link
            href="/app/pair"
            className="mt-3 inline-block text-sm font-medium text-hl-blue-700"
          >
            Connect now
          </Link>
        </div>
      ) : alert ? (
        <Link
          href={`/app/alerts/${alert.id}`}
          className="mt-8 block rounded-2xl border border-hl-alert/30 bg-hl-alert/5 p-5"
        >
          <span
            className={`inline-block rounded-full px-2.5 py-1 text-xs font-semibold ${TONE_CLASSES[STATUS_TONE[alert.status]]}`}
          >
            {STATUS_LABEL[alert.status]}
          </span>
          <p className="mt-3 text-base font-medium text-hl-ink">
            {alert.role === "recipient"
              ? `${alert.counterpartName} reported chest pain`
              : `Your alert to ${alert.counterpartName}`}
          </p>
          <p className="mt-1 text-sm text-hl-blue-700">View alert →</p>
        </Link>
      ) : (
        <div className="mt-10 space-y-4">
          <p className="text-center text-sm text-hl-mist">How are you feeling?</p>
          <PainButton partnerName={relationship.partnerName} />
          <OkayButton />
        </div>
      )}

      <div className="mt-8 flex justify-between text-sm">
        <Link href="/app/profile" className="font-medium text-hl-blue-700">
          Edit your profile
        </Link>
        <Link href="/app/episodes" className="font-medium text-hl-mist">
          Episodes
        </Link>
        <Link href="/app/medications" className="font-medium text-hl-mist">
          Medications
        </Link>
        <Link href="/app/contacts" className="font-medium text-hl-mist">
          Contacts
        </Link>
        {relationship && (
          <Link href="/app/pair" className="font-medium text-hl-mist">
            Trusted contact
          </Link>
        )}
      </div>
    </div>
  );
}
