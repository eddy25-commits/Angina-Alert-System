import Link from "next/link";
import JoinForm from "./JoinForm";

export default function JoinPage() {
  return (
    <div>
      <Link href="/app/pair" className="text-sm font-medium text-hl-blue-700">
        ← Back
      </Link>
      <h1 className="mt-4 font-display text-2xl font-semibold">
        Enter your code
      </h1>
      <p className="mt-2 text-sm leading-relaxed text-hl-mist">
        Ask your trusted contact for the 6-character code from their app.
      </p>
      <JoinForm />
    </div>
  );
}
