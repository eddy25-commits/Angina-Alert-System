# Applying migrations

Claude's build sandbox can't reach `supabase.co` (outbound network is
allowlisted to package registries only), so these have been written and
build-verified locally but never run against the real project. Apply them
yourself with either method below — takes about a minute.

## Option A — Supabase SQL Editor (fastest, no CLI needed)

1. Open your project: https://supabase.com/dashboard/project/bxtwwvqdfikthcrodiyt
2. Go to **SQL Editor** → **New query**.
3. Open `supabase/migrations/0001_profiles.sql` from this repo, paste the
   full contents in, and click **Run**.
4. Open `supabase/migrations/0002_pairing.sql`, paste it into a new query,
   and click **Run**. (Must run *after* 0001 — it references `profiles`.)
5. In **Table Editor** you should now see `profiles`, `relationships`, and
   `pairing_codes`, each with RLS enabled (a lock icon).

## Option B — Supabase CLI

```bash
npx supabase login
npx supabase link --project-ref bxtwwvqdfikthcrodiyt
npx supabase db push
```

## After migrating

1. Copy `.env.example` to `.env.local` and fill in:
   ```
   NEXT_PUBLIC_SUPABASE_URL=https://bxtwwvqdfikthcrodiyt.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=<the publishable key>
   ```
2. `npm install && npm run dev`
3. Visit `/status` — both Supabase checks should show "Connected".
4. Try a real round trip: sign up, confirm the email Supabase sends,
   log in, generate a pairing code on one account, redeem it on a second
   account, confirm both sides show the connection, then disconnect.

Please report back anything that breaks — that's expected on a first live
run, and `PROJECT_PROGRESS.md`'s "Known Bugs" section is where fixes get
tracked once you find them.
