export default function NotConfiguredNotice() {
  return (
    <div className="rounded-xl border border-hl-line bg-hl-paper-dim px-4 py-3 text-sm text-hl-mist">
      HeartLink isn&apos;t connected to Supabase yet, so accounts can&apos;t be
      created or signed into. Add <code className="text-hl-blue-700">NEXT_PUBLIC_SUPABASE_ANON_KEY</code>{" "}
      to <code className="text-hl-blue-700">.env.local</code> to continue setup.
    </div>
  );
}
