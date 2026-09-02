import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/app/actions/auth";
import Logo from "@/components/Logo";
import OfflineBanner from "@/components/OfflineBanner";

// This entire section is per-user and session-dependent — never statically
// prerendered, and never served from a cache shared across users.
export const dynamic = "force-dynamic";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  return (
    <div className="min-h-dvh bg-hl-paper text-hl-ink">
      <OfflineBanner />
      <header className="border-b border-hl-line">
        <div className="mx-auto flex max-w-md items-center justify-between px-6 py-4">
          <Link href="/app" className="flex items-center gap-2.5">
            <Logo size="sm" />
            <span className="font-display text-base font-semibold">
              HeartLink
            </span>
          </Link>
          <form action={signOut}>
            <button
              type="submit"
              className="text-sm font-medium text-hl-mist hover:text-hl-ink"
            >
              Log out
            </button>
          </form>
        </div>
      </header>
      <div className="mx-auto max-w-md px-6 py-8">{children}</div>
      <footer className="mx-auto max-w-md px-6 pb-8 text-center text-xs leading-relaxed text-hl-mist">
        HeartLink does not diagnose or predict medical emergencies and does
        not replace emergency medical services. If you may be having a
        medical emergency, call your local emergency number.
      </footer>
    </div>
  );
}
