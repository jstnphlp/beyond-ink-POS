-- Migration 006: Staff time-in/time-out sessions
-- Creates staff_sessions table for physical department shared login tracking.

create table public.staff_sessions (
  id uuid primary key default gen_random_uuid(),
  staff_name text not null,
  time_in timestamptz not null default timezone('utc', now()),
  time_out timestamptz,
  auto_logged_out boolean not null default false,
  created_at timestamptz not null default timezone('utc', now())
);

alter table public.staff_sessions enable row level security;

-- Owners: full read/write
create policy "staff_sessions_select_owner"
on public.staff_sessions for select to authenticated
using (public.is_owner());

create policy "staff_sessions_insert_owner"
on public.staff_sessions for insert to authenticated
with check (public.is_owner());

create policy "staff_sessions_update_owner"
on public.staff_sessions for update to authenticated
using (public.is_owner()) with check (public.is_owner());

create policy "staff_sessions_delete_owner"
on public.staff_sessions for delete to authenticated
using (public.is_owner());

-- Physical dept users: can insert and read sessions (for time-in/out)
create policy "staff_sessions_select_physical"
on public.staff_sessions for select to authenticated
using (public.get_user_role() = 'physical_dept');

create policy "staff_sessions_insert_physical"
on public.staff_sessions for insert to authenticated
with check (public.get_user_role() = 'physical_dept');

create policy "staff_sessions_update_physical"
on public.staff_sessions for update to authenticated
using (public.get_user_role() = 'physical_dept')
with check (public.get_user_role() = 'physical_dept');

-- Auto-logout function: closes all open sessions at 9PM PHT
create or replace function public.auto_logout_staff()
returns void
language plpgsql
as $$
begin
  update public.staff_sessions
  set time_out = 'today 21:00:00+08'::timestamptz,
      auto_logged_out = true
  where time_out is null;
end;
$$;

-- pg_cron schedule (run manually after enabling pg_cron extension):
-- SELECT cron.schedule(
--   'auto-logout-staff',
--   '0 13 * * *',
--   $$SELECT public.auto_logout_staff()$$
-- );
