-- HeartLink — 0006_medications
-- Phase 6 (Medication Tracking).
--
-- IMPORTANT (per project spec): this app never generates, recommends, or
-- validates dosages. Every field here is entered by the user from their
-- own existing prescription/instructions. No column, default, or
-- function in this migration computes or suggests a dose.

create table if not exists public.medications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  instructions text,
  dose text,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.medications is
  'A user''s own medications, entered by them from their existing prescription. Never generated or recommended by the app.';

create index if not exists medications_user_id_idx on public.medications (user_id);

drop trigger if exists medications_set_updated_at on public.medications;
create trigger medications_set_updated_at
  before update on public.medications
  for each row
  execute function public.set_updated_at();

alter table public.medications enable row level security;

drop policy if exists "medications_owner_all" on public.medications;
create policy "medications_owner_all"
  on public.medications for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.episode_medications (
  id uuid primary key default gen_random_uuid(),
  episode_id uuid not null references public.pain_episodes(id) on delete cascade,
  medication_id uuid not null references public.medications(id) on delete cascade,
  taken_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on table public.episode_medications is
  'A record that a specific medication was taken during a specific episode.';

create index if not exists episode_medications_episode_idx on public.episode_medications (episode_id);
create index if not exists episode_medications_medication_idx on public.episode_medications (medication_id);

alter table public.episode_medications enable row level security;

-- Same visibility as the episode it's attached to: owner, or a paired
-- partner who received an alert for that episode.
drop policy if exists "episode_medications_select" on public.episode_medications;
create policy "episode_medications_select"
  on public.episode_medications for select
  using (
    exists (
      select 1 from public.pain_episodes e
      where e.id = episode_medications.episode_id
        and (
          e.user_id = auth.uid()
          or exists (
            select 1 from public.emergency_alerts a
            join public.relationships r on r.id = a.relationship_id
            where a.episode_id = e.id
              and (r.user_a = auth.uid() or r.user_b = auth.uid())
          )
        )
    )
  );

drop policy if exists "episode_medications_insert_own" on public.episode_medications;
create policy "episode_medications_insert_own"
  on public.episode_medications for insert
  with check (
    exists (
      select 1 from public.pain_episodes e
      where e.id = episode_medications.episode_id and e.user_id = auth.uid()
    )
    and exists (
      select 1 from public.medications m
      where m.id = episode_medications.medication_id and m.user_id = auth.uid()
    )
  );

drop policy if exists "episode_medications_delete_own" on public.episode_medications;
create policy "episode_medications_delete_own"
  on public.episode_medications for delete
  using (
    exists (
      select 1 from public.pain_episodes e
      where e.id = episode_medications.episode_id and e.user_id = auth.uid()
    )
  );
