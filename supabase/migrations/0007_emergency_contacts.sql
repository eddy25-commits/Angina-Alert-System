-- HeartLink — 0007_emergency_contacts
-- Phase 7 (Emergency Contacts).
--
-- Design note: HeartLink's live alert delivery (push notification) only
-- ever goes to the one paired partner from relationships/pairing_codes —
-- that pairing model is inherently 1:1. These emergency_contacts are
-- informational/escalation contacts (e.g. a second family member, a
-- clinician's office) surfaced during an active alert so the sender or
-- recipient know who else to reach out to. They do NOT receive push
-- notifications — HeartLink has no SMS/phone integration in this stack,
-- and it would be dishonest to imply these contacts are "notified" the
-- way the paired partner is.

create table if not exists public.emergency_contacts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  phone text,
  relation text,
  escalation_order smallint not null default 1,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.emergency_contacts is
  'Informational escalation contacts a user configures. Not pushed to — see file header.';

create index if not exists emergency_contacts_user_id_idx on public.emergency_contacts (user_id, escalation_order);

drop trigger if exists emergency_contacts_set_updated_at on public.emergency_contacts;
create trigger emergency_contacts_set_updated_at
  before update on public.emergency_contacts
  for each row
  execute function public.set_updated_at();

alter table public.emergency_contacts enable row level security;

drop policy if exists "emergency_contacts_owner_all" on public.emergency_contacts;
create policy "emergency_contacts_owner_all"
  on public.emergency_contacts for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Lets the paired partner see a sender's escalation contacts ONLY while
-- there's an active (non-final-state) alert between them — useful during
-- a real event, not a standing directory of each other's contacts.
drop policy if exists "emergency_contacts_visible_during_active_alert" on public.emergency_contacts;
create policy "emergency_contacts_visible_during_active_alert"
  on public.emergency_contacts for select
  using (
    exists (
      select 1 from public.emergency_alerts a
      where a.sender_id = emergency_contacts.user_id
        and a.recipient_id = auth.uid()
        and a.status not in ('CANCELLED', 'EXPIRED', 'ACKNOWLEDGED')
    )
  );
