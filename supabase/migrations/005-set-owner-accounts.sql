-- Migration 005: Set owner accounts
-- Assigns owner role to the two specified accounts.

UPDATE public.allowed_users
SET role = 'owner'
WHERE lower(email::text) IN (
  'justinphilipmartinez@gmail.com',
  'paulescobia.13@gmail.com'
);
