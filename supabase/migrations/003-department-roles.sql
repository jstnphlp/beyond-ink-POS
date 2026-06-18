-- Migration 003: Department Role System
-- Adds role column to allowed_users, department column to transactions and catalog tables,
-- helper functions for RLS, and updated department-scoped RLS policies.

-- ============================================================
-- 1. Extend allowed_users with role column
-- ============================================================

ALTER TABLE public.allowed_users
ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'physical_dept'
CHECK (role IN ('owner', 'design_dept', 'physical_dept', 'dev_dept'));

-- ============================================================
-- 2. Add department column to sales_transactions
-- ============================================================

ALTER TABLE public.sales_transactions
ADD COLUMN IF NOT EXISTS department text NOT NULL DEFAULT 'physical_dept'
CHECK (department IN ('design_dept', 'physical_dept', 'dev_dept'));

-- ============================================================
-- 3. Add department column to service_categories
-- ============================================================

ALTER TABLE public.service_categories
ADD COLUMN IF NOT EXISTS department text NOT NULL DEFAULT 'physical_dept'
CHECK (department IN ('design_dept', 'physical_dept', 'dev_dept'));

-- ============================================================
-- 4. Add department column to add_ons
-- ============================================================

ALTER TABLE public.add_ons
ADD COLUMN IF NOT EXISTS department text NOT NULL DEFAULT 'physical_dept'
CHECK (department IN ('design_dept', 'physical_dept', 'dev_dept'));

-- ============================================================
-- 5. Helper functions for RLS
-- ============================================================

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

CREATE OR REPLACE FUNCTION public.is_owner()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT public.get_user_role() = 'owner';
$$;

-- ============================================================
-- 6. Update allowed_users RLS (allow users to read their own role)
-- ============================================================

DROP POLICY IF EXISTS "allowed_users_select_own_email" ON public.allowed_users;
CREATE POLICY "allowed_users_select_own_email"
ON public.allowed_users
FOR SELECT
TO authenticated
USING (
  lower(email::text) = lower(coalesce((auth.jwt() ->> 'email'), ''))
);

-- ============================================================
-- 7. Update sales_transactions RLS — department-scoped
-- ============================================================

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

-- ============================================================
-- 8. Update service_categories RLS — department-scoped
-- ============================================================

DROP POLICY IF EXISTS "service_categories_all_authenticated" ON public.service_categories;

CREATE POLICY "service_categories_select"
ON public.service_categories
FOR SELECT
TO authenticated
USING (
  public.is_owner() OR department = public.get_user_role()
);

CREATE POLICY "service_categories_insert"
ON public.service_categories
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_owner()
);

CREATE POLICY "service_categories_update"
ON public.service_categories
FOR UPDATE
TO authenticated
USING (
  public.is_owner()
)
WITH CHECK (
  public.is_owner()
);

CREATE POLICY "service_categories_delete"
ON public.service_categories
FOR DELETE
TO authenticated
USING (
  public.is_owner()
);

-- ============================================================
-- 9. Update add_ons RLS — department-scoped
-- ============================================================

DROP POLICY IF EXISTS "add_ons_all_authenticated" ON public.add_ons;

CREATE POLICY "add_ons_select"
ON public.add_ons
FOR SELECT
TO authenticated
USING (
  public.is_owner() OR department = public.get_user_role()
);

CREATE POLICY "add_ons_insert"
ON public.add_ons
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_owner()
);

CREATE POLICY "add_ons_update"
ON public.add_ons
FOR UPDATE
TO authenticated
USING (
  public.is_owner()
)
WITH CHECK (
  public.is_owner()
);

CREATE POLICY "add_ons_delete"
ON public.add_ons
FOR DELETE
TO authenticated
USING (
  public.is_owner()
);

-- ============================================================
-- 10. Update inventory_items RLS — physical_dept and owner only
-- ============================================================

DROP POLICY IF EXISTS "inventory_items_all_authenticated" ON public.inventory_items;

CREATE POLICY "inventory_items_select"
ON public.inventory_items
FOR SELECT
TO authenticated
USING (
  public.is_owner() OR public.get_user_role() = 'physical_dept'
);

CREATE POLICY "inventory_items_insert"
ON public.inventory_items
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_owner()
);

CREATE POLICY "inventory_items_update"
ON public.inventory_items
FOR UPDATE
TO authenticated
USING (
  public.is_owner()
)
WITH CHECK (
  public.is_owner()
);

CREATE POLICY "inventory_items_delete"
ON public.inventory_items
FOR DELETE
TO authenticated
USING (
  public.is_owner()
);

-- ============================================================
-- 11. Update inventory_movements RLS — physical_dept and owner only
-- ============================================================

DROP POLICY IF EXISTS "inventory_movements_all_authenticated" ON public.inventory_movements;

CREATE POLICY "inventory_movements_select"
ON public.inventory_movements
FOR SELECT
TO authenticated
USING (
  public.is_owner() OR public.get_user_role() = 'physical_dept'
);

CREATE POLICY "inventory_movements_insert"
ON public.inventory_movements
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_owner() OR public.get_user_role() = 'physical_dept'
);

-- ============================================================
-- 12. service_material_prices — keep all-authenticated (tied to inventory, not dept)
-- ============================================================

-- No change needed; service_material_prices links services to inventory items
-- and doesn't have a department column. Keep existing policy.

-- ============================================================
-- 13. sales_service_lines — department-scoped via parent transaction
-- ============================================================

DROP POLICY IF EXISTS "sales_service_lines_all_authenticated" ON public.sales_service_lines;

CREATE POLICY "sales_service_lines_select"
ON public.sales_service_lines
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sales_transactions t
    WHERE t.id = sales_service_lines.transaction_id
      AND (public.is_owner() OR t.department = public.get_user_role())
  )
);

CREATE POLICY "sales_service_lines_insert"
ON public.sales_service_lines
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sales_transactions t
    WHERE t.id = sales_service_lines.transaction_id
      AND (public.is_owner() OR t.department = public.get_user_role())
  )
);

CREATE POLICY "sales_service_lines_delete"
ON public.sales_service_lines
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sales_transactions t
    WHERE t.id = sales_service_lines.transaction_id
      AND (public.is_owner() OR t.department = public.get_user_role())
  )
);

-- ============================================================
-- 14. sales_material_entries — department-scoped via service line → transaction
-- ============================================================

DROP POLICY IF EXISTS "sales_material_entries_all_authenticated" ON public.sales_material_entries;

CREATE POLICY "sales_material_entries_select"
ON public.sales_material_entries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sales_service_lines sl
    JOIN public.sales_transactions t ON t.id = sl.transaction_id
    WHERE sl.id = sales_material_entries.service_line_id
      AND (public.is_owner() OR t.department = public.get_user_role())
  )
);

CREATE POLICY "sales_material_entries_insert"
ON public.sales_material_entries
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sales_service_lines sl
    JOIN public.sales_transactions t ON t.id = sl.transaction_id
    WHERE sl.id = sales_material_entries.service_line_id
      AND (public.is_owner() OR t.department = public.get_user_role())
  )
);

CREATE POLICY "sales_material_entries_delete"
ON public.sales_material_entries
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sales_service_lines sl
    JOIN public.sales_transactions t ON t.id = sl.transaction_id
    WHERE sl.id = sales_material_entries.service_line_id
      AND (public.is_owner() OR t.department = public.get_user_role())
  )
);

-- ============================================================
-- 15. sales_add_on_entries — department-scoped via material → service line → transaction
-- ============================================================

DROP POLICY IF EXISTS "sales_add_on_entries_all_authenticated" ON public.sales_add_on_entries;

CREATE POLICY "sales_add_on_entries_select"
ON public.sales_add_on_entries
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sales_material_entries me
    JOIN public.sales_service_lines sl ON sl.id = me.service_line_id
    JOIN public.sales_transactions t ON t.id = sl.transaction_id
    WHERE me.id = sales_add_on_entries.material_entry_id
      AND (public.is_owner() OR t.department = public.get_user_role())
  )
);

CREATE POLICY "sales_add_on_entries_insert"
ON public.sales_add_on_entries
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.sales_material_entries me
    JOIN public.sales_service_lines sl ON sl.id = me.service_line_id
    JOIN public.sales_transactions t ON t.id = sl.transaction_id
    WHERE me.id = sales_add_on_entries.material_entry_id
      AND (public.is_owner() OR t.department = public.get_user_role())
  )
);

CREATE POLICY "sales_add_on_entries_delete"
ON public.sales_add_on_entries
FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.sales_material_entries me
    JOIN public.sales_service_lines sl ON sl.id = me.service_line_id
    JOIN public.sales_transactions t ON t.id = sl.transaction_id
    WHERE me.id = sales_add_on_entries.material_entry_id
      AND (public.is_owner() OR t.department = public.get_user_role())
  )
);

-- ============================================================
-- 16. Data migration — assign existing rows to physical_dept
-- ============================================================

UPDATE public.sales_transactions
SET department = 'physical_dept'
WHERE department IS NULL;

UPDATE public.service_categories
SET department = 'physical_dept'
WHERE department IS NULL;

UPDATE public.add_ons
SET department = 'physical_dept'
WHERE department IS NULL;
