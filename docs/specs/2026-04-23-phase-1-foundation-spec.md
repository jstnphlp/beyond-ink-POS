# Phase 1 Foundation Spec

## Summary

Phase 1 establishes the technical base for the Beyond Ink POS web app:

- Next.js App Router on Vercel
- Supabase Postgres as the primary database
- Supabase Auth with Google OAuth
- Email whitelist enforcement through a Supabase table
- A protected dashboard placeholder that future phases will expand

This phase does not yet implement catalog management, inventory transactions, supplier workflows, or POS sales logic.

## Chosen Stack

- Framework: Next.js with TypeScript
- Hosting: Vercel
- Database: Supabase Postgres
- Authentication: Supabase Auth using Google provider
- Authorization gate: `public.allowed_users` table in Supabase
- Testing: Vitest for initial unit coverage

## Auth And Access Flow

1. User opens the app and is redirected to the login page if no valid session exists.
2. User clicks Google sign-in.
3. Supabase Auth handles the OAuth flow.
4. The callback route exchanges the auth code for a session.
5. The app checks whether the Google email exists in `public.allowed_users`.
6. If the email is listed, the user is redirected to the protected dashboard.
7. If the email is not listed, the app signs the user out and redirects to an unauthorized page.

## Initial Data Requirements

The first required database object is:

- `public.allowed_users`
  - `id`
  - `email`
  - `created_at`

Initial row level security behavior:

- authenticated users can only read the allowlist row that matches their own Google email

## App Structure

- `src/app/login`
  - login page and Google sign-in action
- `src/app/auth/callback`
  - OAuth callback handler
- `src/app/dashboard`
  - protected placeholder dashboard
- `src/app/unauthorized`
  - blocked access page
- `src/lib/supabase`
  - browser, server, and middleware clients
- `src/lib/auth`
  - whitelist logic, sign-out action, and authorized-user helper

## Acceptance Criteria

- The app runs as a Next.js project locally
- Google OAuth can be configured through Supabase
- Only emails in `public.allowed_users` can access `/dashboard`
- Non-whitelisted emails are redirected away from the protected area
- The repo includes a documented SQL bootstrap for the allowlist table
