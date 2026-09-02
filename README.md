# HeartLink

A private, mobile-first PWA that lets someone experiencing chest-pain
episodes quickly notify a trusted contact, and keeps a real record of
episodes and responses.

Built by **Nexus Sync Technologies (NST)**.

HeartLink is not a diagnostic tool. It does not diagnose, predict, or
assess the safety of symptoms, and it does not replace a clinician's
guidance or emergency medical services.

## Status

This repository currently contains **Phase 0 — Foundation** only: the
Next.js/TypeScript/Tailwind app shell, PWA configuration (manifest,
icons, service worker), and the Supabase client scaffolding. See
[`PROJECT_PROGRESS.md`](./PROJECT_PROGRESS.md) for exactly what's done,
what's next, and what's blocked.

## Stack

- Next.js (App Router) + TypeScript + Tailwind CSS
- Supabase (Postgres, Auth, Row Level Security)
- Web Push + Service Worker for notifications
- Vercel for hosting

## Getting started

```bash
npm install
cp .env.example .env.local   # then fill in real values
npm run dev
```

Required environment variables are documented in
[`.env.example`](./.env.example). At minimum you need
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to connect
to Supabase; the home screen's "Setup status" panel reports which are
missing.

## Project conventions

- **No mock data, ever.** Every value shown in the UI comes from a real
  authenticated user, a real database row, or a real application event.
  Missing data is a clearly written empty state, not a placeholder
  number.
- **No faked state.** Alert status, notification delivery, etc. only
  change in response to a real, verified event.
- Full rules for how this project is built are in the original
  project brief; day-to-day status lives in `PROJECT_PROGRESS.md`.

## Database

Planned schema and RLS approach: [`docs/DATABASE.md`](./docs/DATABASE.md).
Nothing is migrated yet — that starts in Phase 1.
