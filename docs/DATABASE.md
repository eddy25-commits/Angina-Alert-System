# HeartLink — Database Design (planned)

Status: **designed, not yet migrated**. No tables have been created in the
Supabase project yet — this document is the plan those migrations will
follow, written before implementation as required by the project spec.

All tables use `uuid` primary keys (`gen_random_uuid()`), `created_at` /
`updated_at` timestamps, foreign keys with appropriate `on delete`
behavior, and Row Level Security enabled with explicit policies (default
deny). No table is readable or writable across a pairing boundary except
where a policy explicitly allows it (e.g. a trusted contact reading an
active alert).

## Tables

- **profiles** — one row per `auth.users` id. Display name, avatar,
  notification preferences. Row owned by the user; only the owner can
  read/write their own row (paired partner reads a narrow public subset
  via a view, not this table directly).
- **relationships** — a confirmed pairing between two `profiles`. Stores
  both user ids, status (`active` / `disconnected`), timestamps. Only the
  two paired users can read it.
- **pairing_codes** — short-lived, single-use codes a user generates to
  invite their partner. Expiring, tied to the generating user, consumed
  on redemption.
- **emergency_contacts** — trusted contacts configured by a user (may be
  the paired partner and/or others), with escalation order.
- **push_subscriptions** — Web Push subscription objects per device, tied
  to a user id. Never exposed to any user other than its owner.
- **pain_episodes** — severity, start/end time, notes, symptoms, possible
  triggers, owned by the reporting user. Readable by that user and, for
  active/recent episodes tied to an alert, their paired contact.
- **episode_symptoms** — normalized symptom tags linked to a
  `pain_episodes` row.
- **medications** — a user's own medications (name, instructions, dose,
  as entered by the user from their existing prescription — never
  generated or recommended by the app).
- **episode_medications** — join table linking a medication-taken event
  to a `pain_episodes` row.
- **emergency_alerts** — the core alert record: episode reference,
  sender, recipient(s), status (`CREATED` → `SENT` → `DELIVERED` →
  `OPENED` → `ACKNOWLEDGED`, or `CANCELLED` / `EXPIRED` / `FAILED`), and
  timestamps for each transition. Status changes are only ever written by
  the server in response to a real event — never simulated.
- **audit_logs** — append-only record of security-relevant events
  (pairing created/broken, alert created/acknowledged, contact changed)
  for accountability on a safety-critical app.

## Row Level Security approach

- RLS is enabled on every table above from the first migration that
  creates it — no table ships without policies.
- Default posture is deny; policies are additive and scoped to
  `auth.uid()` plus, where relevant, the counterpart id in an *active*
  `relationships` row.
- Writes to `emergency_alerts.status` are restricted to the
  authenticated party allowed to make that specific transition (e.g.
  only the recipient can move `OPENED` → `ACKNOWLEDGED`).
- `SUPABASE_SERVICE_ROLE_KEY` is only ever used server-side (e.g. to send
  a push notification after an alert is created) and is never sent to
  the client.

## Next step

Phase 1 (Authentication) starts by migrating `profiles` with its RLS
policy and wiring it to `auth.users` via a trigger. That migration will
be added, applied, and tested before Phase 1 is marked complete in
`PROJECT_PROGRESS.md`.
