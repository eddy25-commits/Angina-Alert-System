# HeartLink Development Progress

## Overall Status
Phase: 3 — Emergency Alert (built; blocked on live migration, not on code)
Progress: 45%

## Completed
- [x] Phase 0 — Foundation
- [x] Phase 1 — Authentication
- [x] Phase 2 — Couple Pairing (code complete; see Blocked)

## In Progress
- [ ] Phase 3 — Emergency Alert (code complete, build/lint verified,
      **not yet run against a live database**)
  - [x] `pain_episodes` + `emergency_alerts` migration
        (`supabase/migrations/0003_alerts.sql`), state machine enforced
        entirely in `security definer` functions
        (`create_alert`, `open_alert`, `acknowledge_alert`,
        `cancel_alert`, `mark_alert_sent`)
  - [x] Primary "How are you feeling?" screen on `/app` — only shown once
        paired; shows the live alert instead if one is already open
  - [x] "I'm having pain" — two-step confirm (hard to trigger by
        accident), creates a real episode + alert, redirects to the alert
  - [x] "I'm okay" — intentionally NOT persisted; there's no table for it
        in the spec and inventing one would be exactly the kind of scope
        creep the "no mock data" rule warns against, so it's a pure UI
        acknowledgement
  - [x] Alert detail page: real status, real timestamps, role-aware
        actions (recipient acknowledges, sender cancels)
  - [x] Alert history list, empty state when there are none
  - [x] Copy is honest about the current limitation: while status is
        `CREATED`, the sender sees "push notifications aren't built yet —
        they'll see this next time they open the app" rather than any
        claim that the partner has been notified (per the project's own
        rule against false "your partner has been notified" messaging)
  - [ ] Live end-to-end test — blocked, see below

## Todo
- [ ] Phase 4 — Push notifications (this is what turns `CREATED` alerts
      into real-time ones; `mark_alert_sent()` is already there waiting
      for it)
- [ ] Phase 5 — Pain episode logging (full detail: symptoms, triggers,
      duration, edit/delete — `pain_episodes` currently only has
      severity + start time, set by Phase 3)
- [ ] Phase 6 — Medication tracking
- [ ] Phase 7 — Emergency contacts (beyond the single paired partner)
- [ ] Phase 8 — Dashboard
- [ ] Phase 9 — Safety (offline handling, failure-state copy audit)
- [ ] Phase 10 — Testing

## Blocked
- [ ] **Live migration + live test**, still. Have the real anon key,
      `.env.local` is wired, builds cleanly against the real project
      config — but this sandbox has no network route to `supabase.co`
      (confirmed: `403 host_not_allowed`), so none of migrations
      0001–0003 have been applied yet and nothing has been tested against
      a real signup/pairing/alert. Steps to apply them are in
      `supabase/APPLYING_MIGRATIONS.md`. **This is the actual next step
      before Phase 3 can be called done, not just built.**
- [ ] VAPID keypair for Web Push (needed for Phase 4).
- [ ] `SUPABASE_SERVICE_ROLE_KEY` (needed for Phase 4 — sending a real
      push from server code after an alert is created).

## Known Bugs
- None found — nothing has run against a live database yet.

## Architecture Decisions
- (see Phase 0–2 entries below, unchanged)
- Alert state transitions are each their own `security definer` Postgres
  function with a `where` clause scoped to the caller and the valid prior
  states — e.g. only the recipient can acknowledge, only the sender can
  cancel, and cancelling an already-acknowledged alert is rejected rather
  than silently allowed.
- `pain_episodes` is intentionally minimal in Phase 3 (severity + start
  time only) — full logging detail is explicitly Phase 5's job, so it's
  not built early just because it was easy to bolt on here.
- The "I'm okay" action has no backing table by design (see above).

### Earlier decisions (Phase 0–2)
- Next.js App Router + TypeScript + Tailwind v4, Supabase (Postgres +
  Auth), Vercel hosting, `@supabase/ssr` for browser/server/proxy clients.
- Fonts self-hosted via `@fontsource`, not `next/font/google`.
- Pairing codes: 6 char, single-use, 15 min expiry, redemption logic
  entirely server-side; at most one active relationship per user enforced
  by a database constraint, not just app logic.

## Database Changes
- `0001_profiles.sql`, `0002_pairing.sql`, `0003_alerts.sql` — all
  written and reviewed together for consistency, none yet applied to the
  live project. Apply in that order (see
  `supabase/APPLYING_MIGRATIONS.md`).
- `src/lib/supabase/types.ts` — hand-written row types extended to cover
  `pain_episodes` / `emergency_alerts`; regenerate with the Supabase CLI
  once the project is connected.

## Security Changes
- Every alert status transition is authorization-checked in the database
  function itself (sender vs. recipient, valid prior states) — never
  trusted from the client, and never just a client-side disabled button.
- `emergency_alerts` / `pain_episodes` RLS: visible only to the
  sender/recipient (alerts) or owner + the alert's recipient (episodes,
  via a join) — a paired partner can't browse all of the other person's
  episodes, only ones actually attached to an alert sent to them.

## Testing
- `npm run build`, `npx tsc --noEmit`, `npx eslint .` all pass clean.
- No live/integration testing yet. Planned test once unblocked: two
  paired accounts, account A sends a pain alert, confirm account B sees
  it in `/app` and can acknowledge, confirm A sees the acknowledgement,
  then test cancel separately.

## Next Task
- Apply `0001` → `0002` → `0003` migrations (client/project owner
  action — Claude's sandbox can't reach Supabase), then run the full
  round trip: signup, pairing, send a pain alert, acknowledge it, cancel
  one. Report back what breaks. Then: Phase 4 (push notifications), which
  is what makes alerts actually real-time instead of "seen next time they
  open the app."

## Last Updated
- 2026-08-31 — Phase 3 (Emergency Alert) built and build/lint-verified.
  Still waiting on a live database to confirm any of Phases 1–3 actually
  work end to end.
