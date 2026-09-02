# Applying migrations

Claude's build sandbox can't reach `supabase.co` (outbound network is
allowlisted to package registries only), so migrations are written and
build-verified locally, never applied by Claude directly.

## Status as of this update

- `0001_profiles.sql`, `0002_pairing.sql`, `0003_alerts.sql` — **applied**
  (confirmed working live: signup, login, pairing, and alerts have been
  exercised against the real project).
- `0004_push_notifications.sql` — **applied** (push send code has been
  fixed to actually record real SENT/FAILED status — see
  `PROJECT_PROGRESS.md` — but hasn't been re-tested live since that fix).
- `0005_episode_logging.sql`, `0006_medications.sql`,
  `0007_emergency_contacts.sql` — **written, not yet applied.** These are
  new since the last live round of testing.
- `0008_hardening.sql` — **written, not yet applied.** Closes a real gap
  (`create_alert()` had no duplicate/concurrent-alert guard) and adds
  `audit_logs`, which the original database design called for but had
  never actually been built.

## Applying the remaining migrations (0005–0007)

### Option A — Supabase SQL Editor (fastest, no CLI needed)

1. Open your project: https://supabase.com/dashboard/project/bxtwwvqdfikthcrodiyt
2. **SQL Editor** → **New query**.
3. Paste in `supabase/migrations/0005_episode_logging.sql`, run it.
4. New query → paste `supabase/migrations/0006_medications.sql`, run it.
5. New query → paste `supabase/migrations/0007_emergency_contacts.sql`,
   run it. (Order matters — each depends on tables from earlier ones.)
6. New query → paste `supabase/migrations/0008_hardening.sql`, run it.
   This one modifies `create_alert()`/`redeem_pairing_code()`/
   `disconnect_relationship()`/`acknowledge_alert()`/`cancel_alert()` in
   place (safe — `CREATE OR REPLACE FUNCTION`) and adds `audit_logs`.
7. In **Table Editor** confirm `medications`, `episode_medications`,
   `emergency_contacts`, and `audit_logs` now exist with RLS enabled.

### Option B — Supabase CLI

```bash
npx supabase login
npx supabase link --project-ref bxtwwvqdfikthcrodiyt
npx supabase db push
```

## 🔴 Before you do anything else: rotate the VAPID key

A real VAPID private key was previously committed to `.env.example` in
this repo (now fixed — see `PROJECT_PROGRESS.md`), which means it's
exposed in git history if this repo has been pushed anywhere. That key
can be used to send forged push notifications to your subscribers —
for this app, that means someone could send a fake chest-pain alert.

1. Generate a new keypair (already done once in this session — new
   values are in your local `.env.local`, never committed).
2. Update `NEXT_PUBLIC_VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` in your
   actual deployment's environment variables (Vercel, etc.) — not just
   locally.
3. Existing push subscriptions were signed with the old key and won't
   validate against the new one; users will need to re-enable
   notifications once the new key is live (the profile page's
   notification toggle handles this — no data migration needed).

## After migrating

1. `.env.local` should have real values for: `NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `NEXT_PUBLIC_VAPID_PUBLIC_KEY`,
   `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`. `SUPABASE_SERVICE_ROLE_KEY` is
   still needed for server-to-server operations but hasn't been provided
   yet — see `PROJECT_PROGRESS.md`.
2. `npm install && npm run dev`
3. Visit `/status` to confirm what's connected.
4. Test the new features specifically: log a standalone episode, add a
   medication and mark it taken against an episode, add an emergency
   contact and confirm it shows up on the alert detail page for the
   recipient during an active alert, check the dashboard's numbers match
   what you actually logged.

Report back anything that breaks — `PROJECT_PROGRESS.md`'s "Known Bugs"
section is where fixes get tracked.
