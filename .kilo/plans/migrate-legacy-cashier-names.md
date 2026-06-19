# Plan: Migrate Legacy Cashier Names

## Context

The app defines `CASHIER_NAMES = ["Buknoy", "Mark", "Paul", "Philip"]` in `src/components/sales/cashier-select.tsx:5`, but the `sales_transactions` table stores `cashier_name` as free text. Old transactions may contain legacy names (e.g. "Mae" is used in test fixtures at `src/lib/sales/persistence.test.ts:15`) that no longer match the current list.

The goal is to:
1. Discover what distinct cashier names exist in the database
2. Map legacy names to their new equivalents
3. Run a migration to update all historical records

## Scope

- **Only** `sales_transactions.cashier_name` (not `staff_sessions.staff_name`)
- Both the `cashier_name` column and the `draft_payload->>'cashierName'` JSONB field
- Test fixtures that reference legacy names

## Step 1: Discovery SQL script

Create `supabase/migrations/007-discover-cashier-names.sql`:

```sql
-- Discovery query: list all distinct cashier_name values in the database.
-- Run this first to see what legacy names exist, then use the results
-- to build the UPDATE statements in Step 2.

SELECT DISTINCT cashier_name, COUNT(*) as count
FROM public.sales_transactions
GROUP BY cashier_name
ORDER BY count DESC;
```

This is a read-only query. The user runs it against their Supabase DB (via SQL Editor in the dashboard, or `psql`) and reports back the results.

## Step 2: Build the mapping

Based on the discovery results, the user provides the mapping, e.g.:

| Legacy Name | New Name    |
|-------------|-------------|
| Mae         | Paul        |
| (others)    | (new name)  |

## Step 3: Migration SQL script

Create `supabase/migrations/008-migrate-cashier-names.sql` that:

1. Updates `sales_transactions.cashier_name` using `CASE WHEN`:
   ```sql
   UPDATE public.sales_transactions
   SET cashier_name = CASE
     WHEN cashier_name = 'Mae' THEN 'Paul'
     -- add more mappings here
     ELSE cashier_name
   END
   WHERE cashier_name IN ('Mae' /*, other legacy names */);
   ```

2. Updates the `draft_payload` JSONB field to keep it in sync:
   ```sql
   UPDATE public.sales_transactions
   SET draft_payload = jsonb_set(
     draft_payload,
     '{cashierName}',
     to_jsonb(CASE
       WHEN draft_payload->>'cashierName' = 'Mae' THEN 'Paul'
       -- add more mappings here
       ELSE draft_payload->>'cashierName'
     END)
   )
   WHERE draft_payload->>'cashierName' IN ('Mae' /*, other legacy names */);
   ```

## Step 4: Update test fixtures

Update test files that use legacy cashier names to use one of the current names:

- `src/lib/sales/persistence.test.ts:15` — change `cashierName: "Mae"` → `cashierName: "Paul"`
- `src/lib/sales/persistence.test.ts:65` — change `cashier_name: "Mae"` → `cashier_name: "Paul"`
- `src/lib/sales/persistence.test.ts:96` — change `cashierName: "Mae"` → `cashierName: "Paul"`
- `src/lib/sales/calculations.test.ts:41` — change `cashierName: "Mae"` → `cashierName: "Paul"`
- `src/lib/sales/validation.test.ts:8` — change `cashierName: "Mae"` → `cashierName: "Paul"`

## Step 5: Verify

- Run `npm run typecheck` to ensure no type errors
- Run tests with `npx vitest` to ensure fixtures are consistent
- Query the DB after migration to confirm no legacy names remain:
  ```sql
  SELECT DISTINCT cashier_name FROM public.sales_transactions
  WHERE cashier_name NOT IN ('Buknoy', 'Mark', 'Paul', 'Philip');
  ```

## Files to create/modify

| File | Action |
|------|--------|
| `supabase/migrations/007-discover-cashier-names.sql` | Create (discovery query) |
| `supabase/migrations/008-migrate-cashier-names.sql` | Create (migration, after mapping is known) |
| `src/lib/sales/persistence.test.ts` | Update legacy name in fixtures |
| `src/lib/sales/calculations.test.ts` | Update legacy name in fixtures |
| `src/lib/sales/validation.test.ts` | Update legacy name in fixtures |

## Blocked on

The discovery script (Step 1) must be run first to get the actual legacy names from the database. Once the user reports the results, we can fill in the mapping and execute Steps 2–5.
