# HeartLink Development Progress

## Overall Status
Phase: 10 — all phases built. Migrations 0001–0004 are live; 0005–0008
are written and verified but not yet applied.
Progress: 95% built, ~45% live-confirmed.

**Read this line first:** "all phases built" is a claim about code that
compiles, type-checks, lints clean, and passes its automated tests. It is
NOT a claim that Phases 5–10 work against your real database — they
haven't been run there yet. That distinction is the whole point of
tracking these separately; collapsing it back into one "done" would
undo the reason this file exists.

## Completed and LIVE-VERIFIED
- [x] Phase 0 — Foundation
- [x] Phase 1 — Authentication
- [x] Phase 2 — Couple Pairing
- [x] Phase 3 — Emergency Alert
(all confirmed working against the real Supabase project)

## Completed, fixed after review, NOT yet re-verified live
- [x] Phase 4 — Push Notifications. Built outside this chat, then
      reviewed here. Fixed: a committed VAPID private key (security —
      rotate it in the actual deployment, this is still outstanding),
      `mark_alert_sent()` never being called (alerts stuck at CREATED
      forever regardless of real outcome), a broken/unrunnable test.
      The original send/receive flow was tested live before these
      fixes; the corrected status-tracking logic hasn't been.

## Built this session, NOT yet applied to the live database
- [ ] Phase 5 — Pain episode logging (`0005_episode_logging.sql`)
- [ ] Phase 6 — Medication tracking (`0006_medications.sql`)
- [ ] Phase 7 — Emergency contacts (`0007_emergency_contacts.sql`)
- [x] Phase 8 — Dashboard (no new migration)
- [x] Phase 9 — Safety: disclaimer footer, offline banner, offline-aware
      pain button, service-worker offline fallback page
- [ ] Phase 10 — Testing (see below) — `audit_logs` +
      duplicate-alert guard (`0008_hardening.sql`)

## Phase 10 in detail
- **Unit tests** (`npm test`, no live DB needed): 19 passing — tag
  parsing, error-message humanization, alert status labels, notification
  payload building.
- **Integration/security tests** (`npm run test:integration`): a real
  automated suite (`tests/integration/security.test.ts`) that creates
  throwaway confirmed accounts via the admin API and exercises RLS with
  real anon-key clients — not a service-role bypass. Covers: unpaired
  users can't create alerts, third parties can't read
  relationships/alerts/episodes they're not part of, only the actual
  recipient can acknowledge an alert, duplicate `create_alert()` calls
  return the same alert instead of creating a second one, cancel rejects
  an already-acknowledged alert, invalid pairing codes fail clearly.
  **Currently skips itself** (with the reason printed) because
  `SUPABASE_SERVICE_ROLE_KEY` isn't set — this is real, runnable
  coverage waiting on one env var, not vaporware.
- **Manual test plan** (`docs/MANUAL_TEST_PLAN.md`): PWA installability,
  iOS Safari specifics, mobile responsiveness, offline handling, push
  delivery across two real devices — the things that genuinely need a
  physical device/browser and can't be faked with a unit test.

## A real gap this testing pass found and fixed
`create_alert()` had no guard against duplicate or concurrent alerts —
the project spec explicitly calls out "duplicate alert submission" and
"multiple simultaneous alerts" as cases that must be handled, and this
wasn't. `0008_hardening.sql` makes a second `create_alert()` call while
one is already open return the *existing* alert instead of creating a
duplicate. Covered by an integration test above. Not yet verified live.

## Also added: audit_logs
The original database design (`docs/DATABASE.md`) called for this from
the start; it had been silently dropped along the way. `0008_hardening.sql`
adds it and wires logging into pairing create/redeem/disconnect and
alert create/acknowledge/cancel, via `CREATE OR REPLACE FUNCTION` on the
existing security-definer functions (safe — same authorization logic,
just also writes a log row). No UI was built for it; it's an
accountability record, not a user-facing feature, per the original spec.

## Blocked
- [ ] Migrations `0005`–`0008` need to be applied — see
      `supabase/APPLYING_MIGRATIONS.md`.
- [ ] **VAPID key rotation in the actual deployment** — still
      outstanding, still urgent, independent of migrations.
- [ ] `SUPABASE_SERVICE_ROLE_KEY` — needed for push delivery AND for
      running `npm run test:integration`. One env var unlocks real
      automated security testing; worth prioritizing for that alone.

## Known Bugs
- None currently open. (Two were found and fixed this session — see
  Phase 4 entry above. Phases 5–10 haven't been live-tested at all, so
  "none known" here means exactly that and no more.)

## Testing
- `npm test` — 19/19 passing, no live DB needed.
- `npm run test:integration` — runnable once `SUPABASE_SERVICE_ROLE_KEY`
  is set; currently self-skips with a clear reason.
- `npm run build`, `npx tsc --noEmit`, `npx eslint .` — all clean.
- `docs/MANUAL_TEST_PLAN.md` — device/browser checklist, not yet run.

## Next Task
1. Rotate the VAPID key in the real deployment (independent, urgent).
2. Apply migrations `0005`–`0008`.
3. Set `SUPABASE_SERVICE_ROLE_KEY` and run `npm run test:integration` —
   this is the single highest-value next step: it directly checks the
   security boundaries that matter most for a two-person safety app,
   automatically, against the real project.
4. Run through `docs/MANUAL_TEST_PLAN.md` on real devices.
5. Report back what breaks.

## Last Updated
- 2026-09-02 — All 10 spec phases now have code. Added a real
  integration test suite, closed a duplicate-alert gap, added
  `audit_logs`. Live-verified status unchanged for Phases 5–10 (i.e.
  still not live-verified) — that's the accurate state, not a gap in
  this update.
