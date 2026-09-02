import Link from "next/link";
import { getActiveRelationship } from "./actions";
import GenerateCodeButton from "./GenerateCodeButton";
import DisconnectButton from "./DisconnectButton";

export const dynamic = "force-dynamic";

export default async function PairPage() {
  const { relationship } = await getActiveRelationship();

  return (
    <div>
      <Link href="/app" className="text-sm font-medium text-hl-blue-700">
        ← Back
      </Link>
      <h1 className="mt-4 font-display text-2xl font-semibold">
        Trusted contact
      </h1>

      {relationship ? (
        <div className="mt-6">
          <p className="text-sm leading-relaxed text-hl-mist">
            You&apos;re connected with{" "}
            <span className="font-medium text-hl-ink">
              {relationship.partnerName}
            </span>
            .
          </p>
          <div className="mt-6">
            <DisconnectButton relationshipId={relationship.id} />
          </div>
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          <p className="text-sm leading-relaxed text-hl-mist">
            You haven&apos;t connected with a trusted contact yet. Generate a
            code for them to enter, or enter a code they shared with you.
          </p>

          <GenerateCodeButton />

          <div className="flex items-center gap-3 text-xs text-hl-mist">
            <span className="h-px flex-1 bg-hl-line" />
            or
            <span className="h-px flex-1 bg-hl-line" />
          </div>

          <Link
            href="/app/pair/join"
            className="block w-full rounded-xl border border-hl-blue-500 py-3.5 text-center text-base font-semibold text-hl-blue-700"
          >
            I have a code
          </Link>
        </div>
      )}
    </div>
  );
}
