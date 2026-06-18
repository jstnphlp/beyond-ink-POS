# Performance Optimization Plan — Phase 2

## Context

Phase 1 addressed middleware caching, draft_payload removal, xlsx dynamic import, parallel dashboard queries, and loading skeletons. This plan identifies further bottlenecks discovered by auditing the request lifecycle from middleware → page → queries → client.

---

## Bottlenecks Identified

### 1. Redundant `allowed_users` query on EVERY page load (HIGH)

**Problem:** Middleware caches the role in `user-role` cookie, but `getAuthenticatedUser()` (called on every page) ignores it and queries `allowed_users` again — 1 extra DB round-trip per page.

**File:** `src/lib/auth/get-authorized-user.ts:30-36`

### 2. `getAuthorizedUser()` double-queries `allowed_users` (HIGH)

**Problem:** Calls `isEmailWhitelisted()` (queries `allowed_users.email`) then separately queries `allowed_users.role` — 2 queries where 1 suffices.

**File:** `src/lib/auth/get-authorized-user.ts:60-75`

### 3. History query has no `.limit()` (HIGH)

**Problem:** `getTransactionHistory()` and `getAllTransactionsWithDepartment()` fetch every matching row. With hundreds of transactions, this is slow and sends a large payload.

**File:** `src/lib/sales/queries.ts:154-184`

### 4. `getActiveSessions()` is sequential in sales page (MEDIUM)

**Problem:** In `sales/page.tsx`, `getActiveSessions()` runs AFTER the `Promise.all([setupData, drafts])`, adding a sequential DB call.

**File:** `src/app/dashboard/sales/page.tsx:31-33`

### 5. `getActiveSessions` and `getStaffAttendance` select `*` (MEDIUM)

**Problem:** Selects all columns when only a subset is needed, transferring unnecessary data.

**Files:** `src/app/dashboard/staff-sessions/actions.ts:78-82, 97-99`

### 6. `RefreshSettingsButton` client JS shipped on every SalesShell page (LOW)

**Problem:** `SalesShell` imports `RefreshSettingsButton` (a `"use client"` component) which hydrates on every page using SalesShell (history, drafts, etc.) — unnecessary JS on pages that don't need it.

**File:** `src/components/sales/sales-shell.tsx:32`

### 7. Owner dashboard fetches all-time transactions (LOW)

**Problem:** `getAllTransactionsWithDepartment()` fetches every completed/cancelled transaction. The overview tab likely only needs recent data.

**File:** `src/app/dashboard/page.tsx:31`

---

## Plan

### Change 1: Read role from cookie in `getAuthenticatedUser`

**File:** `src/lib/auth/get-authorized-user.ts`

- Import `cookies` from `next/headers`
- Read the `user-role` cookie (set by middleware)
- If the cookie exists and the user is authenticated, skip the `allowed_users` query entirely
- Fall back to DB query only when the cookie is missing (first request, expired cookie)

```ts
export const getAuthenticatedUser = cache(async (): Promise<AuthorizedUser | null> => {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return null;

  const email = normalizeEmail(user.email) ?? user.email;
  const cookieStore = await cookies();
  const cachedRole = cookieStore.get("user-role")?.value;

  if (cachedRole) {
    return { email, id: user.id, role: cachedRole as UserRole };
  }

  // Fallback: query DB (cookie expired or missing)
  const { data: allowedUser } = await supabase
    .from("allowed_users")
    .select("role")
    .eq("email", email)
    .maybeSingle();

  return {
    email,
    id: user.id,
    role: (allowedUser?.role as UserRole) ?? "physical_dept",
  };
});
```

**Impact:** Eliminates 1 DB query per page navigation (when cookie is warm).

### Change 2: Fix `getAuthorizedUser` double-query

**File:** `src/lib/auth/get-authorized-user.ts`

- Replace the 2-step check (`isEmailWhitelisted` + `select("role")`) with a single `select("email, role")` query
- Remove the `isEmailWhitelisted` call from this function

```ts
export async function getAuthorizedUser(): Promise<AuthorizedUser | null> {
  const supabase = await createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const email = normalizeEmail(user?.email);
  if (!email) return null;

  const { data: allowedUser } = await supabase
    .from("allowed_users")
    .select("email, role")
    .eq("email", email)
    .maybeSingle();

  if (!allowedUser) return null;

  return {
    email,
    id: user!.id,
    role: (allowedUser.role as UserRole) ?? "physical_dept",
  };
}
```

**Impact:** Eliminates 1 redundant DB query per server action call.

### Change 3: Add pagination to history queries

**File:** `src/lib/sales/queries.ts`

- Add `limit` and `offset` parameters to `getTransactionHistory` and `getAllTransactionsWithDepartment`
- Default to 50 rows per page

**File:** `src/components/sales/transaction-history.tsx`

- Add "Load more" button or page controls
- Pass limit/offset from the page

**File:** `src/app/dashboard/sales/history/page.tsx`

- Accept search params for pagination
- Pass paginated data to the component

**Impact:** Reduces initial payload size and DB load proportional to data growth.

### Change 4: Parallelize `getActiveSessions` in sales page

**File:** `src/app/dashboard/sales/page.tsx`

- Move `getActiveSessions()` into the existing `Promise.all` (always call it, return empty if not physical_dept)

```ts
const [setupData, drafts, sessions] = await Promise.all([
  getSalesSetupData(department),
  getDraftTransactions(department),
  department === "physical_dept" ? getActiveSessions() : Promise.resolve([]),
]);
const activeStaff = sessions.map((s) => s.staff_name);
```

**Impact:** Saves ~100-300ms on physical_dept sales page load.

### Change 5: Select only needed columns in staff session queries

**File:** `src/app/dashboard/staff-sessions/actions.ts`

- `getActiveSessions`: change `select("*")` → `select("id, staff_name, time_in")`
- `getStaffAttendance`: change `select("*")` → `select("id, staff_name, time_in, time_out, auto_logged_out")`

**Impact:** Reduces data transfer per query.

### Change 6: Move `RefreshSettingsButton` out of SalesShell

**File:** `src/components/sales/sales-shell.tsx`

- Remove the `RefreshSettingsButton` import and usage from SalesShell
- Render it directly in `SalesWorkspace` (the only place it's needed)

**File:** `src/components/sales/sales-workspace.tsx`

- Add `RefreshSettingsButton` to the workspace layout

**Impact:** Removes unnecessary client component hydration from history, drafts, and other SalesShell pages.

### Change 7: Limit owner dashboard transactions to recent period

**File:** `src/lib/sales/queries.ts`

- Add an optional `sinceDays` parameter to `getAllTransactionsWithDepartment`
- Default to 30 days

**File:** `src/app/dashboard/page.tsx`

- Pass `sinceDays: 30` when calling for the dashboard

**Impact:** Reduces initial dashboard load time and data transfer.

---

## File Changes Summary

### Modified files:
- `src/lib/auth/get-authorized-user.ts` — read role from cookie, fix double-query
- `src/lib/sales/queries.ts` — add pagination params, add `sinceDays` filter
- `src/app/dashboard/sales/page.tsx` — parallelize `getActiveSessions`
- `src/app/dashboard/sales/history/page.tsx` — add pagination support
- `src/components/sales/transaction-history.tsx` — add "Load more" pagination UI
- `src/components/sales/sales-shell.tsx` — remove `RefreshSettingsButton`
- `src/components/sales/sales-workspace.tsx` — add `RefreshSettingsButton` here
- `src/app/dashboard/staff-sessions/actions.ts` — select specific columns
- `src/app/dashboard/page.tsx` — pass `sinceDays` to limit transactions

---

## Expected Impact

| Change | Estimated Improvement |
|---|---|
| Cookie-based role in `getAuthenticatedUser` | -1 DB query per page (~100-200ms) |
| Fix `getAuthorizedUser` double-query | -1 DB query per server action (~100-200ms) |
| History pagination | -50-90% initial payload size |
| Parallel `getActiveSessions` | -100-300ms on sales page |
| Select specific columns | -20-40% data transfer per staff query |
| Move RefreshSettingsButton | -client JS hydration on non-sales pages |
| Limit dashboard transactions | -30-70% dashboard query time |
