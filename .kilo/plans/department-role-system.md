# Department Role System — Implementation Plan

## Summary

Refactor the Beyond Ink POS to support a multi-department role system. Each department (Design, Physical, Development) gets a tailored POS experience. Owners get a centralized dashboard with overview + per-department tabs, full CRUD on all transactions, and can create sales under any department.

---

## Key Design Decisions

| Decision | Choice |
|---|---|
| Roles | `owner`, `design_dept`, `physical_dept`, `dev_dept` in `allowed_users` table |
| Catalog | Department-specific services/add-ons (separate sets per dept), inventory = physical only |
| Services storage | Move from `static-catalog.ts` to database tables |
| Auth | Google OAuth only, role system on top |
| Routing | Auto-route by role after login; owners access all departments |
| URL structure | Keep `/dashboard/sales`, department context from user role/selection |
| Sales wizard | Tailored per department (physical has inventory steps, design/dev don't) |
| Owner POS flow | Select department → use that department's tailored wizard |
| Owner dashboard | Overview tab with combined totals + individual department tabs |
| Owner edit scope | Full edit including completed transactions |
| Existing data | Migration script to assign transactions (default: physical_dept) |

---

## Phase 1: Database Schema & Role Foundation

### 1.1 Extend `allowed_users` table

Add `role` column to existing `allowed_users` table:

```sql
-- Add role column
ALTER TABLE public.allowed_users
ADD COLUMN role text NOT NULL DEFAULT 'physical_dept'
CHECK (role IN ('owner', 'design_dept', 'physical_dept', 'dev_dept'));

-- Update RLS to allow users to read their own role
DROP POLICY IF EXISTS "allowed_users_select_own_email" ON public.allowed_users;
CREATE POLICY "allowed_users_select_own_email"
ON public.allowed_users
FOR SELECT
TO authenticated
USING (
  lower(email::text) = lower(coalesce((auth.jwt() ->> 'email'), ''))
);
```

### 1.2 Add `department` column to `sales_transactions`

```sql
ALTER TABLE public.sales_transactions
ADD COLUMN department text NOT NULL DEFAULT 'physical_dept'
CHECK (department IN ('design_dept', 'physical_dept', 'dev_dept'));
```

### 1.3 Move services/add-ons to database

Create new tables for department-scoped services:

```sql
-- Service categories with department tag
ALTER TABLE public.service_categories
ADD COLUMN department text NOT NULL DEFAULT 'physical_dept'
CHECK (department IN ('design_dept', 'physical_dept', 'dev_dept'));

-- Services already reference service_categories, so they inherit department via category

-- Add-ons with department tag
ALTER TABLE public.add_ons
ADD COLUMN department text NOT NULL DEFAULT 'physical_dept'
CHECK (department IN ('design_dept', 'physical_dept', 'dev_dept'));
```

### 1.4 Seed department-specific data

Create seed data for each department's services catalog. The existing `static-catalog.ts` data gets migrated to the database with department tags.

### 1.5 RLS policies — department-scoped access

Replace current "all authenticated" policies with department-aware ones:

```sql
-- Helper: get user's role from JWT or allowed_users table
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT role FROM public.allowed_users
  WHERE lower(email::text) = lower(coalesce((auth.jwt() ->> 'email'), ''))
  LIMIT 1;
$$;

-- Helper: check if user is owner
CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT public.get_user_role() = 'owner';
$$;

-- sales_transactions: owners see all, dept users see only their dept
DROP POLICY IF EXISTS "sales_transactions_all_authenticated" ON public.sales_transactions;
CREATE POLICY "sales_transactions_select"
ON public.sales_transactions
FOR SELECT
TO authenticated
USING (
  public.is_owner() OR department = public.get_user_role()
);

CREATE POLICY "sales_transactions_insert"
ON public.sales_transactions
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_owner() OR department = public.get_user_role()
);

CREATE POLICY "sales_transactions_update"
ON public.sales_transactions
FOR UPDATE
TO authenticated
USING (
  public.is_owner() OR department = public.get_user_role()
)
WITH CHECK (
  public.is_owner() OR department = public.get_user_role()
);

CREATE POLICY "sales_transactions_delete"
ON public.sales_transactions
FOR DELETE
TO authenticated
USING (
  public.is_owner() OR department = public.get_user_role()
);

-- service_categories: dept users see only their dept's categories
DROP POLICY IF EXISTS "service_categories_all_authenticated" ON public.service_categories;
CREATE POLICY "service_categories_select"
ON public.service_categories
FOR SELECT
TO authenticated
USING (
  public.is_owner() OR department = public.get_user_role()
);

-- Similar policies for services (via category.department), add_ons, inventory_items
-- inventory_items: physical_dept and owner only
```

---

## Phase 2: Auth & Role System (App Layer)

### 2.1 Extend `getAuthorizedUser` to return role

Update `src/lib/auth/get-authorized-user.ts`:

```ts
export type UserRole = 'owner' | 'design_dept' | 'physical_dept' | 'dev_dept';

export type AuthorizedUser = {
  email: string;
  id: string;
  role: UserRole;
};

// Update getAuthorizedUser and getAuthenticatedUser to return role
```

### 2.2 Create role utility functions

New file: `src/lib/auth/roles.ts`

```ts
export function isOwner(role: UserRole): boolean;
export function canAccessDepartment(role: UserRole, department: string): boolean;
export function getDepartmentLabel(dept: string): string;
export function getDefaultRouteForRole(role: UserRole): string;
```

### 2.3 Update middleware for role-based routing

Update `middleware.ts` to:
- Fetch user role after authentication
- Redirect department users to `/dashboard/sales` (their department's view)
- Allow owners to access any route
- Block department users from accessing other departments' routes

### 2.4 Create role context provider

New file: `src/components/auth/role-provider.tsx`

Client-side context that provides the current user's role to all components, avoiding repeated fetches.

---

## Phase 3: Server Actions & Queries Update

### 3.1 Update `queries.ts`

- `getSalesSetupData()` — filter services/add-ons/inventory by department
- `getDraftTransactions()` — filter by department (unless owner)
- `getTransactionHistory()` — filter by department (unless owner)
- Add `getTransactionsByDepartment(department)` for owner dashboard
- Add `getAllTransactionsWithDepartment()` for owner overview

### 3.2 Update `actions.ts`

- `saveDraft()` — validate that user can create sales for the target department
- `completeSale()` — same department validation
- `cancelSale()`, `deleteDraft()`, `deleteTransaction()` — check department access
- `updateTransactionDates()` — owners only (since it affects completed transactions)
- Add `updateCompletedTransaction()` — owners only, full edit of completed transactions

### 3.3 Add department to transaction payload

Update `persistence.ts`:
- `buildTransactionPayload()` — include `department` field
- `DraftSaleInput` type — add `department` field

---

## Phase 4: UI Refactor

### 4.1 Department-tailored sales wizards

Create separate wizard configurations per department:

**Physical Department wizard:**
1. Services step (physical services from DB)
2. Materials step (with inventory integration)
3. Delivery & Discount step
4. Payment & Review step

**Design Department wizard:**
1. Services step (design services from DB)
2. Delivery & Discount step (no materials/inventory)
3. Payment & Review step

**Development Department wizard:**
1. Services step (development services from DB)
2. Delivery & Discount step
3. Payment & Review step

New file: `src/components/sales/wizard-config.ts`

```ts
export type WizardStep = {
  id: string;
  label: string;
  component: React.ComponentType<any>;
};

export function getWizardSteps(role: UserRole, department: string): WizardStep[];
```

### 4.2 Update `SalesWizard` component

Refactor to be dynamic based on department — load steps from wizard config instead of hardcoded step list.

### 4.3 Update `SalesWorkspace` component

- Department users: auto-set department from role, show their tailored wizard
- Owners: show department selector first, then load the selected department's wizard

### 4.4 Owner dashboard

New file: `src/app/dashboard/page.tsx` (refactored)

**For owners:**
- Overview tab: combined totals, recent transactions across all depts, department comparison stats
- Department tabs: one tab per department showing that dept's transactions, drafts, history
- Department selector for creating new sales

**For department users:**
- Simple dashboard showing their department's recent activity
- Quick links to new sale, drafts, history

### 4.5 Update navigation

- Department users: see only their department's nav items
- Owners: see full nav with department context indicators
- Add department badge/indicator in the UI

### 4.6 Update transaction history

- Department users: see only their department's transactions
- Owners: see all transactions with department column/filter
- Owners can edit completed transactions (new edit modal/form)

### 4.7 Services management (owner only)

New route: `/dashboard/settings/services`

- CRUD for service categories (with department tag)
- CRUD for services (linked to categories)
- CRUD for add-ons (with department tag)
- CRUD for inventory items (physical dept only)

---

## Phase 5: Data Migration

### 5.1 Migration script

```sql
-- Assign existing transactions to physical_dept (most common case)
UPDATE public.sales_transactions
SET department = 'physical_dept'
WHERE department IS NULL;

-- Assign existing service categories
UPDATE public.service_categories
SET department = 'physical_dept'
WHERE department IS NULL;

-- Assign existing add_ons
UPDATE public.add_ons
SET department = 'physical_dept'
WHERE department IS NULL;
```

### 5.2 Static catalog → database migration

- Read current `static-catalog.ts` data
- Insert into `service_categories`, `services`, `add_ons` tables with department tags
- Update `getSalesSetupData()` to read from DB instead of static file
- Keep `static-catalog.ts` as fallback/reference during transition

---

## Phase 6: Testing & Polish

### 6.1 Role isolation tests

- Verify department users can only see their department's data
- Verify owners can see all departments
- Verify RLS policies correctly filter at database level
- Test cross-department access attempts (should fail)

### 6.2 UI tests

- Verify department users see only their wizard steps
- Verify owners see department selector
- Verify owner dashboard shows correct overview + tabs
- Verify department badge/indicator shows correctly

### 6.3 Migration testing

- Test migration script on staging data
- Verify existing transactions are correctly assigned
- Verify services catalog migration is complete

---

## File Changes Summary

### New files:
- `src/lib/auth/roles.ts` — role utility functions
- `src/components/auth/role-provider.tsx` — client-side role context
- `src/components/sales/wizard-config.ts` — department-specific wizard configurations
- `src/components/owner/department-selector.tsx` — department picker for owners
- `src/components/owner/overview-tab.tsx` — owner overview dashboard
- `src/components/owner/department-tab.tsx` — owner per-department view
- `src/components/owner/completed-transaction-editor.tsx` — edit completed transactions
- `src/app/dashboard/settings/services/page.tsx` — services management (owner only)
- `supabase/migrations/003-department-roles.sql` — schema migration
- `supabase/migrations/004-seed-department-services.sql` — seed department services

### Modified files:
- `supabase/schema.sql` — add role, department columns, update RLS policies
- `src/lib/auth/get-authorized-user.ts` — return role with user
- `src/lib/sales/types.ts` — add department to DraftSaleInput
- `src/lib/sales/queries.ts` — department-scoped queries
- `src/lib/sales/persistence.ts` — include department in payload
- `src/app/dashboard/sales/actions.ts` — department validation
- `src/app/dashboard/page.tsx` — role-based dashboard rendering
- `src/app/dashboard/sales/page.tsx` — department context
- `src/components/sales/sales-wizard.tsx` — dynamic steps
- `src/components/sales/sales-workspace.tsx` — department-aware workspace
- `src/components/sales/transaction-history.tsx` — department column/filter
- `middleware.ts` — role-based routing

---

## Implementation Order

1. **Phase 1** (Database) — schema changes, RLS policies, seed data
2. **Phase 2** (Auth) — role utilities, middleware, role provider
3. **Phase 3** (Backend) — update queries and actions
4. **Phase 4** (UI) — wizard configs, owner dashboard, nav updates
5. **Phase 5** (Migration) — data migration scripts
6. **Phase 6** (Testing) — role isolation, UI, migration verification
