# Staff Time-In/Time-Out System

## Summary

Physical department uses a shared email (`beyond.ink.ph@gmail`). When logged in, staff (Buknoy, Mark) select who's working. Sessions are logged with timestamps. Owner sees attendance on dashboard. Auto-logout at 9PM PHT via pg_cron.

---

## Key Design Decisions

| Decision | Choice |
|---|---|
| Storage | New `staff_sessions` table in Supabase |
| Staff list | Hardcoded: Buknoy, Mark (physical dept only) |
| Mid-day login | Show active sessions, allow adding unlisted staff |
| Cashier auto-fill | Pre-select from active sessions |
| Auto-logout | pg_cron job at 9PM PHT (1PM UTC) closes open sessions |
| Fallback | On next login, if session still open from yesterday, close it at 9PM PHT |

---

## Phase 1: Database

### 1.1 Create `staff_sessions` table

```sql
CREATE TABLE public.staff_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_name text NOT NULL,
  time_in timestamptz NOT NULL DEFAULT timezone('utc', now()),
  time_out timestamptz,
  auto_logged_out boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);
```

### 1.2 RLS policies

- Owners: full read/write
- Physical dept users: can insert own sessions, read own sessions

### 1.3 Auto-logout function

```sql
CREATE OR REPLACE FUNCTION public.auto_logout_staff()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE public.staff_sessions
  SET time_out = 'today 21:00:00+08'::timestamptz,
      auto_logged_out = true
  WHERE time_out IS NULL;
END;
$$;
```

### 1.4 pg_cron schedule

```sql
SELECT cron.schedule(
  'auto-logout-staff',
  '0 13 * * *',  -- 13:00 UTC = 21:00 PHT
  $$SELECT public.auto_logout_staff()$$
);
```

---

## Phase 2: Server Actions

### 2.1 New file: `src/app/dashboard/staff-sessions/actions.ts`

- `clockIn(staffNames: string[])` — creates session rows for each staff
- `clockOut(staffNames: string[])` — sets time_out on open sessions
- `getActiveSessions()` — returns today's open sessions
- `getStaffAttendance(from?, to?)` — returns attendance log for owner

### 2.2 Query helpers: `src/lib/staff-sessions/queries.ts`

- `getActiveSessionsForToday()` — used by physical dept dashboard
- `getAttendanceLog(from, to)` — used by owner dashboard

---

## Phase 3: Time-In Prompt

### 3.1 New component: `src/components/staff/time-in-prompt.tsx`

- Modal shown on physical dept login when no active sessions (or partial)
- Checkboxes for Buknoy, Mark
- Shows who's already timed in if partial
- "Start Shift" button → calls `clockIn`
- "End Shift" button next to each active staff → calls `clockOut`

### 3.3 Integration: `src/app/dashboard/page.tsx`

- For physical dept users, fetch active sessions
- If no active sessions or partial, show time-in prompt
- Pass active sessions to SalesWorkspace for cashier auto-fill

---

## Phase 4: Cashier Auto-Fill

### 4.1 Update `src/components/sales/sales-wizard.tsx`

- Accept `activeStaff` prop (string[])
- If physical dept and activeStaff has entries, pre-fill cashierName
- Cashier dropdown still allows override

### 4.2 Update `src/components/sales/cashier-select.tsx`

- Accept `preSelected` prop to auto-fill on mount
- Still fully editable

---

## Phase 5: Owner Dashboard — Attendance Tab

### 5.1 New component: `src/components/owner/attendance-tab.tsx`

- Date range filter (default: last 7 days)
- Table: Date | Staff | Time In | Time Out | Hours Worked
- Highlight rows where time_out was auto-set (left early indicator)
- Total hours summary

### 5.2 Update `src/components/owner/owner-dashboard.tsx`

- Add "Staff" tab
- Pass attendance data

### 5.3 Update `src/app/dashboard/page.tsx`

- Fetch attendance log for owner
- Pass to OwnerDashboard

---

## Phase 6: Cleanup & Edge Cases

- On login, check for stale open sessions (from previous day) and auto-close at 9PM PHT
- Ensure time-in prompt doesn't re-show if already timed in for the session
- LocalStorage flag to suppress prompt within same browser session

---

## File Changes Summary

### New files:
- `supabase/migrations/006-staff-sessions.sql` — table, RLS, auto-logout function, pg_cron
- `src/app/dashboard/staff-sessions/actions.ts` — clockIn, clockOut, getActiveSessions
- `src/lib/staff-sessions/queries.ts` — query helpers
- `src/components/staff/time-in-prompt.tsx` — time-in/out modal
- `src/components/owner/attendance-tab.tsx` — attendance log for owner dashboard

### Modified files:
- `src/app/dashboard/page.tsx` — time-in prompt for physical dept, attendance data for owner
- `src/components/sales/sales-wizard.tsx` — accept activeStaff, auto-fill cashier
- `src/components/sales/cashier-select.tsx` — accept preSelected prop
- `src/components/owner/owner-dashboard.tsx` — add Staff tab
- `supabase/schema.sql` — add staff_sessions table
