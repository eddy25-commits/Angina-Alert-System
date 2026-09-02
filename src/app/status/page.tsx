import Logo from "@/components/Logo";

const CHECKS = [
  {
    label: "Supabase project URL",
    ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
  },
  {
    label: "Supabase anon key",
    ok: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
  },
  {
    label: "Push notifications (VAPID keys)",
    ok: Boolean(process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY),
  },
] as const;

export default function Home() {
  return (
    <main className="min-h-dvh flex flex-col bg-hl-void text-white">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-14 pb-10">
        <div className="flex items-center gap-3">
          <Logo size="md" />
          <span className="font-display text-lg font-semibold tracking-tight">
            HeartLink
          </span>
        </div>

        <div className="mt-16 flex flex-1 flex-col justify-center">
          <h1 className="font-display text-3xl font-semibold leading-tight">
            Setup status
          </h1>
          <p className="mt-3 text-hl-mist text-base leading-relaxed max-w-sm">
            Diagnostics for connecting HeartLink to Supabase and push
            notifications during setup.
          </p>

          <div className="mt-10 rounded-2xl border border-hl-line-dark bg-hl-navy-800/60 p-5">
            <h2 className="text-sm font-semibold text-white/90">
              Environment
            </h2>
            <ul className="mt-4 space-y-3">
              {CHECKS.map((check) => (
                <li key={check.label} className="flex items-center gap-3 text-sm">
                  <span
                    aria-hidden
                    className={`h-2.5 w-2.5 rounded-full ${
                      check.ok ? "bg-hl-ok" : "bg-hl-alert"
                    }`}
                  />
                  <span className="text-white/80">{check.label}</span>
                  <span className="ml-auto text-hl-mist">
                    {check.ok ? "Connected" : "Not set"}
                  </span>
                </li>
              ))}
            </ul>
            {!CHECKS.every((c) => c.ok) && (
              <p className="mt-4 text-xs leading-relaxed text-hl-mist">
                Add the missing values to <code className="text-hl-cyan-300">.env.local</code>{" "}
                (see <code className="text-hl-cyan-300">.env.example</code>) to continue setup.
              </p>
            )}
          </div>
        </div>

        <p className="text-center text-xs text-hl-mist">
          Built by Nexus Sync Technologies
        </p>
      </div>
    </main>
  );
}
