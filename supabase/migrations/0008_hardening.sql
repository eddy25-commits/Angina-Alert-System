-- HeartLink — 0008_hardening
-- Closes two gaps surfaced while writing Phase 10 tests:
--
-- 1. create_alert() had no guard against duplicate/concurrent alerts.
--    The project spec explicitly calls out "duplicate alert submission"
--    and "multiple simultaneous alerts" as cases that must be handled
--    (never trust the frontend's disabled-button state for this).
-- 2. audit_logs was planned in docs/DATABASE.md from the start but never
--    built. Adding it now rather than continuing to silently drop it.

-- ---------------------------------------------------------------------
-- 1. Duplicate alert guard
-- ---------------------------------------------------------------------
-- If the caller already has an open alert as sender, return THAT alert
-- instead of creating a second one. Idempotent rather than an error, so
-- a retried request (flaky network, double-tap that got past the
-- client-side disable) safely lands on the same alert instead of
-- failing or spawning a duplicate.
create or replace function public.create_alert(severity_input smallint default null)
returns public.emergency_alerts
language plpgsql
security definer set search_path = public
as $$
declare
  rel public.relationships;
  new_episode public.pain_episodes;
  new_alert public.emergency_alerts;
  existing_alert public.emergency_alerts;
  partner uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into existing_alert
  from public.emergency_alerts
  where sender_id = auth.uid()
    and status in ('CREATED', 'SENT', 'DELIVERED', 'OPENED')
  order by created_at desc
  limit 1;

  if found then
    return existing_alert;
  end if;

  select * into rel from public.relationships
  where status = 'active' and (user_a = auth.uid() or user_b = auth.uid())
  limit 1;

  if not found then
    raise exception 'No trusted contact connected';
  end if;

  partner := case when rel.user_a = auth.uid() then rel.user_b else rel.user_a end;

  insert into public.pain_episodes (user_id, severity)
  values (auth.uid(), severity_input)
  returning * into new_episode;

  insert into public.emergency_alerts (episode_id, relationship_id, sender_id, recipient_id, status)
  values (new_episode.id, rel.id, auth.uid(), partner, 'CREATED')
  returning * into new_alert;

  insert into public.audit_logs (user_id, event_type, entity_type, entity_id, metadata)
  values (auth.uid(), 'alert_created', 'emergency_alerts', new_alert.id, jsonb_build_object('recipient_id', partner));

  return new_alert;
end;
$$;

-- ---------------------------------------------------------------------
-- 2. audit_logs
-- ---------------------------------------------------------------------
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  event_type text not null,
  entity_type text not null,
  entity_id uuid,
  metadata jsonb not null default '{}',
  created_at timestamptz not null default now()
);

comment on table public.audit_logs is
  'Append-only record of security-relevant events. Written only by security-definer functions, never directly by the client.';

create index if not exists audit_logs_user_id_idx on public.audit_logs (user_id, created_at desc);

alter table public.audit_logs enable row level security;

-- Read-only for the user it's about; nobody can insert/update/delete via
-- the client — only security-definer functions (which run as the
-- function owner, bypassing RLS) write here.
drop policy if exists "audit_logs_select_own" on public.audit_logs;
create policy "audit_logs_select_own"
  on public.audit_logs for select
  using (auth.uid() = user_id);

-- Log pairing and disconnect events (create_pairing_code /
-- redeem_pairing_code / disconnect_relationship from 0002 didn't log —
-- adding it here via CREATE OR REPLACE rather than duplicating the
-- whole function bodies inline in this file).
create or replace function public.redeem_pairing_code(input_code text)
returns public.relationships
language plpgsql
security definer set search_path = public
as $$
declare
  code_row public.pairing_codes;
  new_relationship public.relationships;
  lo uuid;
  hi uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  select * into code_row
  from public.pairing_codes
  where code = upper(trim(input_code))
  for update;

  if not found then
    raise exception 'That code is not valid';
  end if;

  if code_row.consumed_at is not null then
    raise exception 'That code has already been used';
  end if;

  if code_row.expires_at < now() then
    raise exception 'That code has expired';
  end if;

  if code_row.created_by = auth.uid() then
    raise exception 'You can''t redeem your own pairing code';
  end if;

  if exists (
    select 1 from public.relationships
    where status = 'active' and (user_a = auth.uid() or user_b = auth.uid())
  ) then
    raise exception 'Already paired with a trusted contact';
  end if;

  if exists (
    select 1 from public.relationships
    where status = 'active'
      and (user_a = code_row.created_by or user_b = code_row.created_by)
  ) then
    raise exception 'That person is already paired with someone';
  end if;

  lo := least(auth.uid(), code_row.created_by);
  hi := greatest(auth.uid(), code_row.created_by);

  insert into public.relationships (user_a, user_b, status)
  values (lo, hi, 'active')
  returning * into new_relationship;

  update public.pairing_codes
  set consumed_at = now(), consumed_by = auth.uid()
  where id = code_row.id;

  insert into public.audit_logs (user_id, event_type, entity_type, entity_id, metadata)
  values
    (auth.uid(), 'relationship_created', 'relationships', new_relationship.id, jsonb_build_object('via', 'redeemed_code')),
    (code_row.created_by, 'relationship_created', 'relationships', new_relationship.id, jsonb_build_object('via', 'code_redeemed_by_partner'));

  return new_relationship;
end;
$$;

create or replace function public.disconnect_relationship(relationship_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  rel public.relationships;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.relationships
  set status = 'disconnected', disconnected_at = now()
  where id = relationship_id
    and status = 'active'
    and (user_a = auth.uid() or user_b = auth.uid())
  returning * into rel;

  if not found then
    raise exception 'Relationship not found or already disconnected';
  end if;

  insert into public.audit_logs (user_id, event_type, entity_type, entity_id, metadata)
  values
    (rel.user_a, 'relationship_disconnected', 'relationships', rel.id, jsonb_build_object('disconnected_by', auth.uid())),
    (rel.user_b, 'relationship_disconnected', 'relationships', rel.id, jsonb_build_object('disconnected_by', auth.uid()));
end;
$$;

-- Log alert acknowledgement and cancellation too.
create or replace function public.acknowledge_alert(alert_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  updated public.emergency_alerts;
begin
  update public.emergency_alerts
  set status = 'ACKNOWLEDGED', acknowledged_at = now()
  where id = alert_id
    and recipient_id = auth.uid()
    and status in ('CREATED', 'SENT', 'DELIVERED', 'OPENED')
  returning * into updated;

  if not found then
    raise exception 'Alert not found or already resolved';
  end if;

  insert into public.audit_logs (user_id, event_type, entity_type, entity_id, metadata)
  values (auth.uid(), 'alert_acknowledged', 'emergency_alerts', updated.id, '{}');
end;
$$;

create or replace function public.cancel_alert(alert_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
declare
  updated public.emergency_alerts;
begin
  update public.emergency_alerts
  set status = 'CANCELLED', cancelled_at = now()
  where id = alert_id
    and sender_id = auth.uid()
    and status not in ('ACKNOWLEDGED', 'CANCELLED', 'EXPIRED')
  returning * into updated;

  if not found then
    raise exception 'Alert not found or already acknowledged';
  end if;

  insert into public.audit_logs (user_id, event_type, entity_type, entity_id, metadata)
  values (auth.uid(), 'alert_cancelled', 'emergency_alerts', updated.id, '{}');
end;
$$;
