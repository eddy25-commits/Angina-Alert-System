# HeartLink — Database Design

Status: **`0001`–`0004` applied to the live Supabase project.
`0005`–`0007` written and reviewed, not yet applied** — see
`supabase/APPLYING_MIGRATIONS.md`.

All tables use `uuid` primary keys (`gen_random_uuid()`), `created_at` /
`updated_at` timestamps, foreign keys with appropriate `on delete`
behavior, and Row Level Security enabled with explicit policies (default
deny). No table is readable or writable across a pairing boundary except
where a policy explicitly allows it.

## Tables

- **profiles** (`0001`) — one row per `auth.users` id. Owned by the user.
- **relationships** (`0002`) — a confirmed pairing between two profiles.
  Only ever created by `redeem_pairing_code()`. At most one active
  relationship per user, enforced by a partial unique index.
- **pairing_codes** (`0002`) — short-lived (15 min), single-use codes.
- **pain_episodes** (`0003`, extended `0005`) — severity, start/end time,
  notes, plus `symptoms` / `possible_triggers` (`text[]` tags, not a
  normalized join table — see Architecture Decisions in
  `PROJECT_PROGRESS.md`). Owner has full CRUD (`0005`); a paired partner
  can read one only if it's attached to an alert sent to them.
- **emergency_alerts** (`0003`) — the core alert record. Status
  (`CREATED → SENT/FAILED → ... → ACKNOWLEDGED`, or `CANCELLED`/
  `EXPIRED`) only ever changes via `security definer` functions
  (`create_alert`, `mark_alert_sent`, `open_alert`, `acknowledge_alert`,
  `cancel_alert`) — never a direct client write.
- **push_subscriptions** (`0004`) — Web Push subscriptions, one per
  device. `is_active` soft-delete (set false on a failed/expired send)
  rather than hard delete. Owner-only RLS.
- **medications** (`0006`) — a user's own medications, entered by them
  from their existing prescription. The app never generates or suggests
  a name/dose/instructions.
- **episode_medications** (`0006`) — join table recording that a
  medication was taken during a specific episode. Same visibility as the
  episode it's attached to (owner, or a partner who got an alert for it).
- **emergency_contacts** (`0007`) — informational escalation contacts
  (not the paired partner — that's `relationships`). Owner-only, except
  visible to the alert recipient while an alert from that owner is
  active. **Not pushed to** — HeartLink has no SMS/phone integration;
  these are for the recipient's reference during a real event.

## Row Level Security approach

- RLS is enabled on every table from the migration that creates it — no
  table ships without policies.
- Default posture is deny; policies are additive, scoped to `auth.uid()`
  plus, where relevant, the counterpart in an *active* relationship or
  alert.
- Cross-user state changes (pairing, alert status) happen only inside
  `security definer` Postgres functions with their own authorization
  checks — RLS alone doesn't gate those, the function logic does.
- `SUPABASE_SERVICE_ROLE_KEY` is used server-side only, for push
  delivery (`createServiceClient()` in `src/lib/supabase/server.ts`) —
  never sent to the client.

## Known deviation from the original plan

An earlier draft of this document called for an `audit_logs` table. It
hasn't been built — flagging it here rather than silently dropping it,
in case it matters more once real usage patterns are known.
