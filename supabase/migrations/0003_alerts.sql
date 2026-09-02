-- HeartLink — 0003_alerts
-- Phase 3 (Emergency Alert core flow).
-- Depends on 0001_profiles.sql and 0002_pairing.sql. Run after both.

create table if not exists public.pain_episodes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  severity smallint check (severity between 1 and 10),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.pain_episodes is
  'A reported chest-pain episode. Full detail (symptoms, triggers, duration) is added in Phase 5 — this table starts minimal, tied to the alert flow.';

create index if not exists pain_episodes_user_id_idx on public.pain_episodes (user_id);

drop trigger if exists pain_episodes_set_updated_at on public.pain_episodes;
create trigger pain_episodes_set_updated_at
  before update on public.pain_episodes
  for each row
  execute function public.set_updated_at();

alter table public.pain_episodes enable row level security;

-- No direct insert/update policy: episodes are only created/updated by
-- create_alert() / cancel handling below (security definer).

create table if not exists public.emergency_alerts (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.pain_episodes(id) on delete cascade,
  relationship_id uuid not null references public.relationships(id) on delete cascade,
  sender_id uuid not null references public.profiles(id),
  recipient_id uuid not null references public.profiles(id),
  status text not null default 'CREATED' check (
    status in ('CREATED', 'SENT', 'DELIVERED', 'OPENED', 'ACKNOWLEDGED', 'CANCELLED', 'EXPIRED', 'FAILED')
  ),
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  delivered_at timestamptz,
  opened_at timestamptz,
  acknowledged_at timestamptz,
  cancelled_at timestamptz
);

comment on table public.emergency_alerts is
  'The core alert record. Status only ever advances in response to a real event (see functions below) — never set directly by the client.';

create index if not exists emergency_alerts_recipient_idx on public.emergency_alerts (recipient_id, status);
create index if not exists emergency_alerts_sender_idx on public.emergency_alerts (sender_id);

alter table public.emergency_alerts enable row level security;

-- Owner can always read their own episodes. A paired partner can read an
-- episode only if it's attached to an alert they're the recipient of --
-- i.e. episodes are never broadly visible across a pairing, only the
-- ones actually shared via an alert.
drop policy if exists "pain_episodes_select" on public.pain_episodes;
create policy "pain_episodes_select"
  on public.pain_episodes for select
  using (
    auth.uid() = user_id
    or exists (
      select 1 from public.emergency_alerts a
      join public.relationships r on r.id = a.relationship_id
      where a.episode_id = pain_episodes.id
        and (r.user_a = auth.uid() or r.user_b = auth.uid())
    )
  );

drop policy if exists "emergency_alerts_select" on public.emergency_alerts;
create policy "emergency_alerts_select"
  on public.emergency_alerts for select
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

-- No direct insert/update policy: all writes go through the
-- security-definer functions below, which enforce who can make which
-- state transition.

-- Creates a real pain episode + alert together. Only a user in an active
-- relationship can do this, and only to their paired partner.
create or replace function public.create_alert(severity_input smallint default null)
returns public.emergency_alerts
language plpgsql
security definer set search_path = public
as $$
declare
  rel public.relationships;
  new_episode public.pain_episodes;
  new_alert public.emergency_alerts;
  partner uuid;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
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

  return new_alert;
end;
$$;

-- Marks an alert SENT/FAILED. Called by server code right after a real
-- push send attempt (Phase 4) — not implemented yet, so nothing calls
-- this today. Restricted to the sender's own alert.
create or replace function public.mark_alert_sent(alert_id uuid, succeeded boolean)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.emergency_alerts
  set status = case when succeeded then 'SENT' else 'FAILED' end,
      sent_at = case when succeeded then now() else sent_at end
  where id = alert_id
    and sender_id = auth.uid()
    and status = 'CREATED';

  if not found then
    raise exception 'Alert not found or not in a state that can be marked sent';
  end if;
end;
$$;

-- Recipient opens the alert (viewed the detail screen).
create or replace function public.open_alert(alert_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.emergency_alerts
  set status = 'OPENED', opened_at = coalesce(opened_at, now())
  where id = alert_id
    and recipient_id = auth.uid()
    and status in ('CREATED', 'SENT', 'DELIVERED');

  -- No `if not found` raise here: opening an already-opened/acknowledged
  -- alert, or one that's since been cancelled, is a harmless no-op.
end;
$$;

-- Recipient acknowledges ("I'm awake").
create or replace function public.acknowledge_alert(alert_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.emergency_alerts
  set status = 'ACKNOWLEDGED', acknowledged_at = now()
  where id = alert_id
    and recipient_id = auth.uid()
    and status in ('CREATED', 'SENT', 'DELIVERED', 'OPENED');

  if not found then
    raise exception 'Alert not found or already resolved';
  end if;
end;
$$;

-- Sender cancels their own alert, only while it hasn't been acknowledged.
create or replace function public.cancel_alert(alert_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.emergency_alerts
  set status = 'CANCELLED', cancelled_at = now()
  where id = alert_id
    and sender_id = auth.uid()
    and status not in ('ACKNOWLEDGED', 'CANCELLED', 'EXPIRED');

  if not found then
    raise exception 'Alert not found or already acknowledged';
  end if;
end;
$$;
