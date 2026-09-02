# HeartLink — Manual Test Plan

Automated coverage: `npm test` (pure logic) and `npm run test:integration`
(RLS/authorization boundaries against a real Supabase project — needs
`SUPABASE_SERVICE_ROLE_KEY` set). This document covers what genuinely
can't be automated: real devices, real browsers, real network conditions.

## PWA installability
- [ ] iOS Safari: "Add to Home Screen" produces a standalone app icon
      using the HeartLink mark, not a generic browser icon
- [ ] Launching from the home screen opens in standalone mode (no Safari
      chrome), status bar readable against the app's dark header
- [ ] Android Chrome: install prompt appears, installed app behaves the
      same way

## iOS Safari specifics
- [ ] Safe-area insets respected on a notched device (content doesn't
      sit under the status bar or home indicator)
- [ ] Viewport doesn't zoom unexpectedly when focusing a text input
- [ ] Push notification permission prompt appears correctly (iOS 16.4+
      required for web push — confirm target iOS version supports it,
      and that the app degrades gracefully with a clear message on
      older iOS rather than a silent failure)

## Mobile responsiveness
- [ ] Primary "I'm having pain" / "I'm okay" screen: buttons are large,
      thumb-reachable, and not accidentally triggerable by a stray tap
      near the edge of the screen
- [ ] All forms (episode log, medication, contact) usable one-handed on
      a standard phone width
- [ ] Long content (episode history, alert history) scrolls correctly
      without breaking the fixed header/footer

## Offline handling
- [ ] Turn on airplane mode, reload the app: offline fallback page
      appears instead of a browser error, with the emergency-number
      guidance visible
- [ ] With the app already open, turn off network mid-session: the
      offline banner appears; the "I'm having pain" button becomes
      disabled with a clear reason rather than silently failing on tap
- [ ] Restore network: banner disappears, app functions normally again
      without requiring a manual reload

## Push notification delivery (needs two real devices)
- [ ] Device A sends a pain alert; Device B (paired partner, granted
      notification permission) receives a real push within a few
      seconds while the app is backgrounded
- [ ] Tapping the notification opens directly to the correct alert
      detail screen, not just the app's home screen
- [ ] Revoke notification permission in the OS settings, send another
      alert: Device A's alert correctly shows FAILED status rather than
      silently appearing to succeed
- [ ] Confirm the alert's status transitions match reality: CREATED
      only when push isn't configured at all; SENT/FAILED once it is

## Cross-account safety spot-checks
(Most of this is covered by `npm run test:integration` — these are the
UI-level versions worth confirming by hand at least once.)
- [ ] Log in as the paired partner, open an active alert, confirm
      emergency contacts shown belong to the sender, not your own
- [ ] Confirm a disconnected (former) partner can no longer see new
      alerts or episodes after disconnecting
