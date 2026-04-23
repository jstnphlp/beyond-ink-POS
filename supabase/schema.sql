create extension if not exists citext;

create table if not exists public.allowed_users (
  id uuid primary key default gen_random_uuid(),
  email citext not null unique,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.allowed_users enable row level security;

drop policy if exists "allowed_users_select_own_email" on public.allowed_users;

create policy "allowed_users_select_own_email"
on public.allowed_users
for select
to authenticated
using (
  lower(email::text) = lower(coalesce((auth.jwt() ->> 'email'), ''))
);

comment on table public.allowed_users is
'Application allowlist for Beyond Ink POS Google-authenticated users.';
