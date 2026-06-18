# Performance Optimization Plan — Beyond Ink POS

## Problem

The deployed site feels slow. After analyzing the codebase, there are several bottlenecks across the middleware, data fetching, and client bundle.

---

## Bottlenecks Identified

### 1. Middleware: 2-3 DB queries on EVERY navigation (CRITICAL)

`middleware.ts` runs on every request and makes:
- `supabase.auth.getUser()` — network call to Supabase Auth
- `supabase.from("allowed_users").select("role")` — DB query for role
- `supabase.from("staff_sessions").select("id")` — DB query for physical dept active sessions

That's **3 sequential network round-trips per page navigation**. This is the single biggest bottleneck.

### 2. `draft_payload` fetched for ALL history/dashboard queries (MAJOR)

Both `getTransactionHistory` and `getAllTransactionsWithDepartment` select `draft_payload` — a large JSONB column containing the full sale structure. This is only needed when a user clicks "View" on a receipt, but it's loaded for every row in every query.

### 3. `xlsx` library bundled eagerly (~400KB) (MODERATE)

`xlsx` is imported at the top of `export-excel.ts` and bundled into the client JS. It's only used when the "Export to Excel" button is clicked.

### 4. Owner dashboard: 3 sequential draft queries (MODERATE)

```ts
for (const dept of ALL_DEPARTMENTS) {
  departmentDrafts[dept] = await getDraftTransactions(dept); // sequential!
}
```

### 5. No `loading.tsx` for history page (MINOR)

Users see a blank page while the history server component fetches data.

---

## Plan

### Phase 1: Fix Middleware (biggest impact)

**File: `middleware.ts`**

- **Cache the user role in a cookie** after the first lookup. On subsequent requests, read the role from the cookie instead of querying `allowed_users` every time.
- **Cache the staff_sessions check in a cookie** (e.g., `staff-on-shift=true/false`, TTL 60s). Only query `staff_sessions` when the cookie is missing or expired.
- Result: Middleware goes from 3 network calls → 1 on cached requests (just `getUser()`).

```ts
// Pseudocode for optimized middleware
const roleCookie = request.cookies.get("user-role")?.value;
if (roleCookie) {
  // Use cached role, skip DB query
} else {
  // Query allowed_users, set cookie on response (max-age=300)
}

// For physical_dept staff_sessions check:
const staffCookie = request.cookies.get("staff-on-shift")?.value;
if (staffCookie !== undefined) {
  // Use cached value
} else {
  // Query staff_sessions, set cookie (max-age=60)
}
```

### Phase 2: Stop fetching `draft_payload` in list queries

**File: `src/lib/sales/queries.ts`**

- Remove `draft_payload` from the `select()` in `getTransactionHistory` and `getAllTransactionsWithDepartment`.
- Add a new `getTransactionPayload(transactionId)` server action that fetches `draft_payload` for a single transaction when the user clicks "View".
- Update `TransactionHistory` component to fetch the payload on demand (via a server action call when "View" is clicked) instead of having it pre-loaded.

**File: `src/app/dashboard/sales/actions.ts`**

- Add `getTransactionPayload(transactionId: string)` server action.

**File: `src/components/sales/transaction-history.tsx`**

- Change `selectedTxn` to fetch `draft_payload` lazily when "View" is clicked.

### Phase 3: Dynamic import `xlsx`

**File: `src/lib/sales/export-excel.ts`**

- Change `import * as XLSX from "xlsx"` to `const XLSX = await import("xlsx")` inside the export function.
- This removes ~400KB from the initial client bundle.

### Phase 4: Parallelize owner dashboard queries

**File: `src/app/dashboard/page.tsx`**

- Replace the sequential `for` loop with `Promise.all`:
```ts
const draftResults = await Promise.all(
  ALL_DEPARTMENTS.map((dept) => getDraftTransactions(dept))
);
```

### Phase 5: Add loading.tsx for history

**File: `src/app/dashboard/sales/history/loading.tsx`**

- Add a skeleton loading state for the history page.

---

## File Changes Summary

### Modified files:
- `middleware.ts` — cache role in cookie, remove staff_sessions query
- `src/lib/sales/queries.ts` — remove `draft_payload` from list queries
- `src/lib/sales/export-excel.ts` — dynamic import xlsx
- `src/app/dashboard/page.tsx` — parallelize draft queries
- `src/components/sales/transaction-history.tsx` — lazy-load receipt payload on "View"
- `src/app/dashboard/sales/actions.ts` — add `getTransactionPayload` action

### New files:
- `src/app/dashboard/sales/history/loading.tsx` — skeleton loading state

---

## Expected Impact

| Change | Estimated Improvement |
|---|---|
| Middleware cookie caching | -2 DB queries per navigation (~200-400ms) |
| Remove draft_payload from list queries | -30-70% payload size per history/dashboard load |
| Dynamic xlsx import | -400KB from initial JS bundle |
| Parallel draft queries | -200-600ms on owner dashboard load |
| History loading skeleton | Better perceived performance |
