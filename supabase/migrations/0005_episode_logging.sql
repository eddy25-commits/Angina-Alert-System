-- HeartLink — 0005_episode_logging
-- Phase 5 (Pain Episode Logging).
--
-- pain_episodes already has severity/started_at/ended_at/notes from
-- 0003_alerts.sql. This adds the remaining fields and, importantly, the
-- owner CRUD policies that were deliberately left out of 0003 (Phase 3
-- only needed episodes created via create_alert()).
--
-- Design note: the original schema plan (docs/DATABASE.md) called for a
-- normalized episode_symptoms table. This uses a plain text[] column
-- instead — symptoms here are free-form tags with no independent
-- lookup/reporting need yet, so a join table would add complexity
-- without adding real capability. Revisit if that changes.

alter table public.pain_episodes
  add column if not exists symptoms text[] not null default '{}',
  add column if not exists possible_triggers text[] not null default '{}';

comment on column public.pain_episodes.symptoms is 'Free-form tags, e.g. "shortness of breath".';
comment on column public.pain_episodes.possible_triggers is 'Free-form tags, e.g. "after climbing stairs".';

-- Owner can log, edit, and delete their own episodes directly (not just
-- via create_alert()). A paired partner's read access via an attached
-- alert, from 0003, is unaffected.
drop policy if exists "pain_episodes_insert_own" on public.pain_episodes;
create policy "pain_episodes_insert_own"
  on public.pain_episodes for insert
  with check (auth.uid() = user_id);

drop policy if exists "pain_episodes_update_own" on public.pain_episodes;
create policy "pain_episodes_update_own"
  on public.pain_episodes for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "pain_episodes_delete_own" on public.pain_episodes;
create policy "pain_episodes_delete_own"
  on public.pain_episodes for delete
  using (auth.uid() = user_id);
