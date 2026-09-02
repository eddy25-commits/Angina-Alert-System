-- HeartLink — 0002_pairing
-- Phase 2 (Couple Pairing).
-- Depends on 0001_profiles.sql. Run after it, in order.

create table if not exists public.relationships (
  id uuid primary key default gen_random_uuid(),
  user_a uuid not null references public.profiles(id) on delete cascade,
  user_b uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'disconnected')),
  created_at timestamptz not null default now(),
  disconnected_at timestamptz,
  constraint relationships_distinct_users check (user_a <> user_b),
  -- Store the pair in a canonical order so (A,B) and (B,A) can't both exist.
  constraint relationships_ordered_pair check (user_a < user_b)
);

comment on table public.relationships is
  'A confirmed pairing between two profiles. Only the two paired users can read their row.';

-- At most one *active* relationship per user at a time.
create unique index if not exists relationships_one_active_per_user_a
  on public.relationships (user_a) where status = 'active';
create unique index if not exists relationships_one_active_per_user_b
  on public.relationships (user_b) where status = 'active';

alter table public.relationships enable row level security;

drop policy if exists "relationships_select_own" on public.relationships;
create policy "relationships_select_own"
  on public.relationships for select
  using (auth.uid() = user_a or auth.uid() = user_b);

drop policy if exists "relationships_update_own" on public.relationships;
create policy "relationships_update_own"
  on public.relationships for update
  using (auth.uid() = user_a or auth.uid() = user_b)
  with check (auth.uid() = user_a or auth.uid() = user_b);

-- No direct insert policy: rows are only created by redeem_pairing_code()
-- below (security definer), never by an unmediated client insert.

create table if not exists public.pairing_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  created_by uuid not null references public.profiles(id) on delete cascade,
  expires_at timestamptz not null,
  consumed_at timestamptz,
  consumed_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

comment on table public.pairing_codes is
  'Short-lived, single-use codes a user generates to invite their partner.';

create index if not exists pairing_codes_created_by_idx
  on public.pairing_codes (created_by);

alter table public.pairing_codes enable row level security;

drop policy if exists "pairing_codes_select_own" on public.pairing_codes;
create policy "pairing_codes_select_own"
  on public.pairing_codes for select
  using (auth.uid() = created_by);

drop policy if exists "pairing_codes_insert_own" on public.pairing_codes;
create policy "pairing_codes_insert_own"
  on public.pairing_codes for insert
  with check (auth.uid() = created_by);

-- No update/delete policy for regular users: a code is only ever marked
-- consumed by redeem_pairing_code() (security definer). Codes are left in
-- place (not deleted) so audit_logs / history has something to point at.

-- Generates a 6-character code, avoiding ambiguous characters (0/O, 1/I).
create or replace function public.generate_pairing_code()
returns text
language plpgsql
as $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
begin
  for i in 1..6 loop
    result := result || substr(chars, floor(random() * length(chars) + 1)::int, 1);
  end loop;
  return result;
end;
$$;

-- Creates a new pairing code for the calling user, expiring in 15 minutes.
create or replace function public.create_pairing_code()
returns public.pairing_codes
language plpgsql
security definer set search_path = public
as $$
declare
  new_code text;
  row_result public.pairing_codes;
  attempt int := 0;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  -- If the caller is already actively paired, don't hand out a new code.
  if exists (
    select 1 from public.relationships
    where status = 'active' and (user_a = auth.uid() or user_b = auth.uid())
  ) then
    raise exception 'Already paired with a trusted contact';
  end if;

  loop
    new_code := public.generate_pairing_code();
    attempt := attempt + 1;
    begin
      insert into public.pairing_codes (code, created_by, expires_at)
      values (new_code, auth.uid(), now() + interval '15 minutes')
      returning * into row_result;
      exit;
    exception when unique_violation then
      if attempt > 5 then
        raise exception 'Could not generate a unique code, try again';
      end if;
    end;
  end loop;

  return row_result;
end;
$$;

-- Redeems a pairing code: validates it, then atomically creates the
-- relationship and marks the code consumed. This is the ONLY way a
-- relationships row is ever created.
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

  return new_relationship;
end;
$$;

-- Ends an active relationship. Either paired user may disconnect.
create or replace function public.disconnect_relationship(relationship_id uuid)
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'Not authenticated';
  end if;

  update public.relationships
  set status = 'disconnected', disconnected_at = now()
  where id = relationship_id
    and status = 'active'
    and (user_a = auth.uid() or user_b = auth.uid());

  if not found then
    raise exception 'Relationship not found or already disconnected';
  end if;
end;
$$;
