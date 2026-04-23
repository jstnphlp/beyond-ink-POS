# Beyond Ink POS

Phase 1 foundation scaffold for the printing business POS system.

## Stack

- Next.js App Router
- TypeScript
- Supabase Postgres
- Supabase Auth with Google OAuth
- Supabase allowlist table for approved emails
- Vercel deployment target

## Local setup

1. Copy `.env.example` to `.env.local`.
2. Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`.
3. Run `supabase/schema.sql` inside the Supabase SQL editor.
4. Add approved emails to `public.allowed_users`.
5. Configure Google OAuth in Supabase Auth.
6. Install dependencies with `npm install`.
7. Run `npm run dev`.

## Current routes

- `/login` for Google sign-in
- `/dashboard` for the protected placeholder dashboard
- `/unauthorized` for signed-in but non-whitelisted users

## Current scope

This scaffold only covers foundation concerns:

- app shell
- auth flow
- email whitelist enforcement
- protected dashboard placeholder

Catalog, inventory, suppliers, purchases, POS checkout, and reports come next.
