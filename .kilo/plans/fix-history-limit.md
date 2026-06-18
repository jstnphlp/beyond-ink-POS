# Fix: History page not showing all orders

## Problem

Phase 2 added `.limit(50)` to `getTransactionHistory()` and the history page defaults to `PAGE_LIMIT = 50`. This hides transactions beyond the first 50, breaking the expected behavior where all history was visible.

The "Load more" button exists but only increments by 50 up to a max of 500 — it's clunky and still caps the data.

## Root Cause

- `getTransactionHistory()` in `src/lib/sales/queries.ts:156` has `limit = 50` default parameter
- `TransactionHistoryPage` in `src/app/dashboard/sales/history/page.tsx:10` uses `PAGE_LIMIT = 50`
- The `.limit(limit)` call on the Supabase query truncates results

## Fix

### 1. Remove the limit from `getTransactionHistory` (revert to returning all rows)

**File:** `src/lib/sales/queries.ts`

- Remove the `limit` parameter from `getTransactionHistory`
- Remove `.limit(limit)` from the query chain
- Keep `getAllTransactionsWithDepartment` with its `sinceDays` and `limit` params (dashboard still benefits from that)

```ts
export async function getTransactionHistory(department?: Department): Promise<TransactionListItem[]> {
  const supabase = await createServerClient();
  let query = supabase
    .from("sales_transactions")
    .select("id, transaction_number, status, department, cashier_name, final_total, created_at, completed_at, cancelled_at")
    .eq("status", "completed")
    .order("transaction_number", { ascending: false });

  if (department) {
    query = query.eq("department", department);
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as TransactionListItem[];
}
```

### 2. Simplify the history page — remove pagination plumbing

**File:** `src/app/dashboard/sales/history/page.tsx`

- Remove `searchParams` prop, `PAGE_LIMIT`, and limit logic
- Revert to the simple version that passes all transactions to the component
- Remove `currentLimit` and `hasMore` props

### 3. Remove "Load more" button from TransactionHistory component

**File:** `src/components/sales/transaction-history.tsx`

- Remove `currentLimit` and `hasMore` props from the component interface
- Remove the "Load more" button JSX

## Files to Modify

- `src/lib/sales/queries.ts` — remove `limit` param from `getTransactionHistory`
- `src/app/dashboard/sales/history/page.tsx` — simplify back to no pagination
- `src/components/sales/transaction-history.tsx` — remove "Load more" button and related props