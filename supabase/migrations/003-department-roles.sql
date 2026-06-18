-- Department Role System — Single migration
-- Run this entire file in Supabase SQL Editor.

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
-- 3. Create service_categories table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.service_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  department text NOT NULL DEFAULT 'physical_dept'
    CHECK (department IN ('design_dept', 'physical_dept', 'dev_dept')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- ============================================================
-- 4. Create services table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category_id uuid,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- ============================================================
-- 5. Create add_ons table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.add_ons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  department text NOT NULL DEFAULT 'physical_dept'
    CHECK (department IN ('design_dept', 'physical_dept', 'dev_dept')),
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now())
);

-- ============================================================
-- 6. Create service_material_prices table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.service_material_prices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL,
  inventory_item_id uuid NOT NULL REFERENCES public.inventory_items(id) ON DELETE RESTRICT,
  suggested_unit_price numeric(12, 2) NOT NULL,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  UNIQUE (service_id, inventory_item_id)
);

-- ============================================================
-- 7. Seed all categories
-- ============================================================

INSERT INTO public.service_categories (id, name, department, is_active) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Standard Printing',  'physical_dept', true),
  ('a0000000-0000-0000-0000-000000000002', 'Photo Printing',     'physical_dept', true),
  ('a0000000-0000-0000-0000-000000000003', 'Sticker Printing',   'physical_dept', true),
  ('a0000000-0000-0000-0000-000000000004', 'Others',             'physical_dept', true),
  ('a0000000-0000-0000-0000-000000000006', 'Magazine Printing',  'physical_dept', true),
  ('a0000000-0000-0000-0000-000000000007', 'Book Binding',       'physical_dept', true),
  ('a0000000-0000-0000-0000-000000000005', 'Advanced Services',  'design_dept', true),
  ('a0000000-0000-0000-0000-000000000010', 'Graphic Design',     'design_dept', true),
  ('a0000000-0000-0000-0000-000000000011', 'Video & Multimedia', 'design_dept', true),
  ('a0000000-0000-0000-0000-000000000020', 'Web Development',    'dev_dept', true),
  ('a0000000-0000-0000-0000-000000000021', 'Software Solutions', 'dev_dept', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 8. Seed all services
-- ============================================================

INSERT INTO public.services (id, name, category_id, is_active) VALUES
  -- Standard Printing (physical_dept)
  ('b0000000-0000-0000-0000-000000000040', 'Standard Printing (Black)',   'a0000000-0000-0000-0000-000000000001', true),
  ('b0000000-0000-0000-0000-000000000041', 'Standard Printing (Colored)', 'a0000000-0000-0000-0000-000000000001', true),
  ('b0000000-0000-0000-0000-000000000042', 'Photocopy / Xerox (Black)',   'a0000000-0000-0000-0000-000000000001', true),
  ('b0000000-0000-0000-0000-000000000043', 'Photocopy / Xerox (Colored)', 'a0000000-0000-0000-0000-000000000001', true),
  ('b0000000-0000-0000-0000-000000000003', 'Scanning',                    'a0000000-0000-0000-0000-000000000001', true),
  ('b0000000-0000-0000-0000-000000000045', 'Hot Laminating',              'a0000000-0000-0000-0000-000000000001', true),
  ('b0000000-0000-0000-0000-000000000046', 'Phototop/Coldtop',            'a0000000-0000-0000-0000-000000000001', true),
  -- Photo Printing (physical_dept)
  ('b0000000-0000-0000-0000-000000000010', '3R Photo Print',  'a0000000-0000-0000-0000-000000000002', true),
  ('b0000000-0000-0000-0000-000000000011', '4R Photo Print',  'a0000000-0000-0000-0000-000000000002', true),
  ('b0000000-0000-0000-0000-000000000012', 'A4 Photo Print',  'a0000000-0000-0000-0000-000000000002', true),
  ('b0000000-0000-0000-0000-000000000004', 'Rush ID',         'a0000000-0000-0000-0000-000000000002', true),
  -- Sticker Printing (physical_dept)
  ('b0000000-0000-0000-0000-000000000007', 'Custom Stickers/Labels',  'a0000000-0000-0000-0000-000000000003', true),
  ('b0000000-0000-0000-0000-000000000036', 'Sticker on Sintra Board', 'a0000000-0000-0000-0000-000000000003', true),
  -- Others (physical_dept)
  ('b0000000-0000-0000-0000-000000000020', 'Certificates & Award',      'a0000000-0000-0000-0000-000000000004', true),
  ('b0000000-0000-0000-0000-000000000021', 'Flyers/Tri-Fold Brochures', 'a0000000-0000-0000-0000-000000000004', true),
  ('b0000000-0000-0000-0000-000000000022', 'Business Cards',            'a0000000-0000-0000-0000-000000000004', true),
  ('b0000000-0000-0000-0000-000000000023', 'Simple Editing',            'a0000000-0000-0000-0000-000000000004', true),
  -- Magazine Printing (physical_dept)
  ('b0000000-0000-0000-0000-000000000050', 'Magazine (A4, Colored)',       'a0000000-0000-0000-0000-000000000006', true),
  ('b0000000-0000-0000-0000-000000000051', 'Magazine (A5, Colored)',       'a0000000-0000-0000-0000-000000000006', true),
  ('b0000000-0000-0000-0000-000000000052', 'Magazine (A4, Black & White)', 'a0000000-0000-0000-0000-000000000006', true),
  -- Book Binding (physical_dept)
  ('b0000000-0000-0000-0000-000000000060', 'Spiral/Coil Binding',   'a0000000-0000-0000-0000-000000000007', true),
  ('b0000000-0000-0000-0000-000000000061', 'Tape Binding',          'a0000000-0000-0000-0000-000000000007', true),
  ('b0000000-0000-0000-0000-000000000062', 'Saddle-Stitch Binding', 'a0000000-0000-0000-0000-000000000007', true),
  ('b0000000-0000-0000-0000-000000000063', 'Hard-Bound Binding',    'a0000000-0000-0000-0000-000000000007', true),
  ('b0000000-0000-0000-0000-000000000064', 'Staple Binding',        'a0000000-0000-0000-0000-000000000007', true),
  -- Advanced Services (design_dept)
  ('b0000000-0000-0000-0000-000000000030', 'Typing',           'a0000000-0000-0000-0000-000000000005', true),
  ('b0000000-0000-0000-0000-000000000031', 'Research',         'a0000000-0000-0000-0000-000000000005', true),
  ('b0000000-0000-0000-0000-000000000032', 'Layout Design',    'a0000000-0000-0000-0000-000000000005', true),
  ('b0000000-0000-0000-0000-000000000033', 'Photo Editing',    'a0000000-0000-0000-0000-000000000005', true),
  ('b0000000-0000-0000-0000-000000000034', 'Video Editing',    'a0000000-0000-0000-0000-000000000005', true),
  ('b0000000-0000-0000-0000-000000000035', 'Website Services', 'a0000000-0000-0000-0000-000000000005', true),
  -- Graphic Design (design_dept)
  ('b0000000-0000-0000-0000-000000000070', 'Logo Design',             'a0000000-0000-0000-0000-000000000010', true),
  ('b0000000-0000-0000-0000-000000000071', 'Brand Identity Package',  'a0000000-0000-0000-0000-000000000010', true),
  ('b0000000-0000-0000-0000-000000000072', 'Social Media Graphics',   'a0000000-0000-0000-0000-000000000010', true),
  ('b0000000-0000-0000-0000-000000000073', 'Poster/Flyer Design',     'a0000000-0000-0000-0000-000000000010', true),
  ('b0000000-0000-0000-0000-000000000074', 'UI/UX Design',            'a0000000-0000-0000-0000-000000000010', true),
  -- Video & Multimedia (design_dept)
  ('b0000000-0000-0000-0000-000000000075', 'Motion Graphics',  'a0000000-0000-0000-0000-000000000011', true),
  ('b0000000-0000-0000-0000-000000000076', 'Video Production', 'a0000000-0000-0000-0000-000000000011', true),
  ('b0000000-0000-0000-0000-000000000077', 'Animation',        'a0000000-0000-0000-0000-000000000011', true),
  -- Web Development (dev_dept)
  ('b0000000-0000-0000-0000-000000000080', 'Business Website',     'a0000000-0000-0000-0000-000000000020', true),
  ('b0000000-0000-0000-0000-000000000081', 'E-commerce Site',      'a0000000-0000-0000-0000-000000000020', true),
  ('b0000000-0000-0000-0000-000000000082', 'Landing Page',         'a0000000-0000-0000-0000-000000000020', true),
  ('b0000000-0000-0000-0000-000000000083', 'Web Application',      'a0000000-0000-0000-0000-000000000020', true),
  -- Software Solutions (dev_dept)
  ('b0000000-0000-0000-0000-000000000084', 'Custom Software',       'a0000000-0000-0000-0000-000000000021', true),
  ('b0000000-0000-0000-0000-000000000085', 'API Integration',       'a0000000-0000-0000-0000-000000000021', true),
  ('b0000000-0000-0000-0000-000000000086', 'Database Setup',        'a0000000-0000-0000-0000-000000000021', true),
  ('b0000000-0000-0000-0000-000000000087', 'Technical Consultation','a0000000-0000-0000-0000-000000000021', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 9. Insert placeholder services for orphaned service_ids in existing transactions
-- ============================================================

INSERT INTO public.services (id, name, category_id, is_active)
SELECT DISTINCT
  sl.service_id,
  COALESCE(sl.service_name, 'Legacy Service'),
  NULL::uuid,
  true
FROM public.sales_service_lines sl
WHERE sl.service_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.services s WHERE s.id = sl.service_id
  )
ON CONFLICT (id) DO NOTHING;

-- Insert placeholder add-ons for orphaned add_on_ids
INSERT INTO public.add_ons (id, name, department, is_active)
SELECT DISTINCT
  ao.add_on_id,
  COALESCE(ao.add_on_name, 'Legacy Add-on'),
  'physical_dept',
  true
FROM public.sales_add_on_entries ao
WHERE ao.add_on_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.add_ons a WHERE a.id = ao.add_on_id
  )
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 10. Now add FK constraints (all referenced IDs exist)
-- ============================================================

DO $$
BEGIN
  -- services.category_id → service_categories
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'services_category_id_fkey'
  ) THEN
    ALTER TABLE public.services
      ADD CONSTRAINT services_category_id_fkey
      FOREIGN KEY (category_id) REFERENCES public.service_categories(id) ON DELETE SET NULL;
  END IF;

  -- service_material_prices.service_id → services
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'service_material_prices_service_id_fkey'
  ) THEN
    ALTER TABLE public.service_material_prices
      ADD CONSTRAINT service_material_prices_service_id_fkey
      FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE CASCADE;
  END IF;

  -- sales_service_lines.service_id → services
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_service_lines_service_id_fkey'
  ) THEN
    ALTER TABLE public.sales_service_lines
      ADD CONSTRAINT sales_service_lines_service_id_fkey
      FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE RESTRICT;
  END IF;

  -- sales_add_on_entries.add_on_id → add_ons
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_add_on_entries_add_on_id_fkey'
  ) THEN
    ALTER TABLE public.sales_add_on_entries
      ADD CONSTRAINT sales_add_on_entries_add_on_id_fkey
      FOREIGN KEY (add_on_id) REFERENCES public.add_ons(id) ON DELETE RESTRICT;
  END IF;
END $$;

-- ============================================================
-- 11. Enable RLS on all tables
-- ============================================================

ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.add_ons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_material_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_service_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_material_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_add_on_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 12. Helper functions for RLS
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
-- 13. RLS Policies
-- ============================================================

-- allowed_users: users can read their own row, owners can manage all
DROP POLICY IF EXISTS "allowed_users_select_own_email" ON public.allowed_users;
CREATE POLICY "allowed_users_select_own_email"
ON public.allowed_users FOR SELECT TO authenticated
USING (
  public.is_owner() OR lower(email::text) = lower(coalesce((auth.jwt() ->> 'email'), ''))
);

CREATE POLICY "allowed_users_insert_owner"
ON public.allowed_users FOR INSERT TO authenticated
WITH CHECK (public.is_owner());

CREATE POLICY "allowed_users_update_owner"
ON public.allowed_users FOR UPDATE TO authenticated
USING (public.is_owner()) WITH CHECK (public.is_owner());

CREATE POLICY "allowed_users_delete_owner"
ON public.allowed_users FOR DELETE TO authenticated
USING (public.is_owner());

-- service_categories: dept-scoped read, owner-only write
DROP POLICY IF EXISTS "service_categories_all_authenticated" ON public.service_categories;

CREATE POLICY "service_categories_select"
ON public.service_categories FOR SELECT TO authenticated
USING (public.is_owner() OR department = public.get_user_role());

CREATE POLICY "service_categories_insert"
ON public.service_categories FOR INSERT TO authenticated
WITH CHECK (public.is_owner());

CREATE POLICY "service_categories_update"
ON public.service_categories FOR UPDATE TO authenticated
USING (public.is_owner()) WITH CHECK (public.is_owner());

CREATE POLICY "service_categories_delete"
ON public.service_categories FOR DELETE TO authenticated
USING (public.is_owner());

-- services: dept-scoped read via category, owner-only write
DROP POLICY IF EXISTS "services_all_authenticated" ON public.services;

CREATE POLICY "services_select"
ON public.services FOR SELECT TO authenticated
USING (
  public.is_owner() OR EXISTS (
    SELECT 1 FROM public.service_categories sc
    WHERE sc.id = services.category_id
      AND sc.department = public.get_user_role()
  )
);

CREATE POLICY "services_insert"
ON public.services FOR INSERT TO authenticated
WITH CHECK (public.is_owner());

CREATE POLICY "services_update"
ON public.services FOR UPDATE TO authenticated
USING (public.is_owner()) WITH CHECK (public.is_owner());

CREATE POLICY "services_delete"
ON public.services FOR DELETE TO authenticated
USING (public.is_owner());

-- add_ons: dept-scoped read, owner-only write
DROP POLICY IF EXISTS "add_ons_all_authenticated" ON public.add_ons;

CREATE POLICY "add_ons_select"
ON public.add_ons FOR SELECT TO authenticated
USING (public.is_owner() OR department = public.get_user_role());

CREATE POLICY "add_ons_insert"
ON public.add_ons FOR INSERT TO authenticated
WITH CHECK (public.is_owner());

CREATE POLICY "add_ons_update"
ON public.add_ons FOR UPDATE TO authenticated
USING (public.is_owner()) WITH CHECK (public.is_owner());

CREATE POLICY "add_ons_delete"
ON public.add_ons FOR DELETE TO authenticated
USING (public.is_owner());

-- inventory_items: physical_dept + owner only
DROP POLICY IF EXISTS "inventory_items_all_authenticated" ON public.inventory_items;

CREATE POLICY "inventory_items_select"
ON public.inventory_items FOR SELECT TO authenticated
USING (public.is_owner() OR public.get_user_role() = 'physical_dept');

CREATE POLICY "inventory_items_insert"
ON public.inventory_items FOR INSERT TO authenticated
WITH CHECK (public.is_owner());

CREATE POLICY "inventory_items_update"
ON public.inventory_items FOR UPDATE TO authenticated
USING (public.is_owner()) WITH CHECK (public.is_owner());

CREATE POLICY "inventory_items_delete"
ON public.inventory_items FOR DELETE TO authenticated
USING (public.is_owner());

-- service_material_prices: all authenticated (no dept column)
DROP POLICY IF EXISTS "service_material_prices_all_authenticated" ON public.service_material_prices;
CREATE POLICY "service_material_prices_all_authenticated"
ON public.service_material_prices FOR ALL TO authenticated
USING (true) WITH CHECK (true);

-- sales_transactions: dept-scoped
DROP POLICY IF EXISTS "sales_transactions_all_authenticated" ON public.sales_transactions;

CREATE POLICY "sales_transactions_select"
ON public.sales_transactions FOR SELECT TO authenticated
USING (public.is_owner() OR department = public.get_user_role());

CREATE POLICY "sales_transactions_insert"
ON public.sales_transactions FOR INSERT TO authenticated
WITH CHECK (public.is_owner() OR department = public.get_user_role());

CREATE POLICY "sales_transactions_update"
ON public.sales_transactions FOR UPDATE TO authenticated
USING (public.is_owner() OR department = public.get_user_role())
WITH CHECK (public.is_owner() OR department = public.get_user_role());

CREATE POLICY "sales_transactions_delete"
ON public.sales_transactions FOR DELETE TO authenticated
USING (public.is_owner() OR department = public.get_user_role());

-- sales_service_lines: dept-scoped via parent
DROP POLICY IF EXISTS "sales_service_lines_all_authenticated" ON public.sales_service_lines;

CREATE POLICY "sales_service_lines_select"
ON public.sales_service_lines FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.sales_transactions t
  WHERE t.id = sales_service_lines.transaction_id
    AND (public.is_owner() OR t.department = public.get_user_role())
));

CREATE POLICY "sales_service_lines_insert"
ON public.sales_service_lines FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.sales_transactions t
  WHERE t.id = sales_service_lines.transaction_id
    AND (public.is_owner() OR t.department = public.get_user_role())
));

CREATE POLICY "sales_service_lines_delete"
ON public.sales_service_lines FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.sales_transactions t
  WHERE t.id = sales_service_lines.transaction_id
    AND (public.is_owner() OR t.department = public.get_user_role())
));

-- sales_material_entries: dept-scoped via service line → transaction
DROP POLICY IF EXISTS "sales_material_entries_all_authenticated" ON public.sales_material_entries;

CREATE POLICY "sales_material_entries_select"
ON public.sales_material_entries FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.sales_service_lines sl
  JOIN public.sales_transactions t ON t.id = sl.transaction_id
  WHERE sl.id = sales_material_entries.service_line_id
    AND (public.is_owner() OR t.department = public.get_user_role())
));

CREATE POLICY "sales_material_entries_insert"
ON public.sales_material_entries FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.sales_service_lines sl
  JOIN public.sales_transactions t ON t.id = sl.transaction_id
  WHERE sl.id = sales_material_entries.service_line_id
    AND (public.is_owner() OR t.department = public.get_user_role())
));

CREATE POLICY "sales_material_entries_delete"
ON public.sales_material_entries FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.sales_service_lines sl
  JOIN public.sales_transactions t ON t.id = sl.transaction_id
  WHERE sl.id = sales_material_entries.service_line_id
    AND (public.is_owner() OR t.department = public.get_user_role())
));

-- sales_add_on_entries: dept-scoped via material → service line → transaction
DROP POLICY IF EXISTS "sales_add_on_entries_all_authenticated" ON public.sales_add_on_entries;

CREATE POLICY "sales_add_on_entries_select"
ON public.sales_add_on_entries FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.sales_material_entries me
  JOIN public.sales_service_lines sl ON sl.id = me.service_line_id
  JOIN public.sales_transactions t ON t.id = sl.transaction_id
  WHERE me.id = sales_add_on_entries.material_entry_id
    AND (public.is_owner() OR t.department = public.get_user_role())
));

CREATE POLICY "sales_add_on_entries_insert"
ON public.sales_add_on_entries FOR INSERT TO authenticated
WITH CHECK (EXISTS (
  SELECT 1 FROM public.sales_material_entries me
  JOIN public.sales_service_lines sl ON sl.id = me.service_line_id
  JOIN public.sales_transactions t ON t.id = sl.transaction_id
  WHERE me.id = sales_add_on_entries.material_entry_id
    AND (public.is_owner() OR t.department = public.get_user_role())
));

CREATE POLICY "sales_add_on_entries_delete"
ON public.sales_add_on_entries FOR DELETE TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.sales_material_entries me
  JOIN public.sales_service_lines sl ON sl.id = me.service_line_id
  JOIN public.sales_transactions t ON t.id = sl.transaction_id
  WHERE me.id = sales_add_on_entries.material_entry_id
    AND (public.is_owner() OR t.department = public.get_user_role())
));

-- inventory_movements: physical_dept + owner only
DROP POLICY IF EXISTS "inventory_movements_all_authenticated" ON public.inventory_movements;

CREATE POLICY "inventory_movements_select"
ON public.inventory_movements FOR SELECT TO authenticated
USING (public.is_owner() OR public.get_user_role() = 'physical_dept');

CREATE POLICY "inventory_movements_insert"
ON public.inventory_movements FOR INSERT TO authenticated
WITH CHECK (public.is_owner() OR public.get_user_role() = 'physical_dept');

-- ============================================================
-- 14. Assign existing transaction rows to physical_dept
-- ============================================================

UPDATE public.sales_transactions
SET department = 'physical_dept'
WHERE department IS NULL;

-- ============================================================
-- 15. Set owner accounts
-- ============================================================

UPDATE public.allowed_users
SET role = 'owner'
WHERE lower(email::text) IN (
  'justinphilipmartinez@gmail.com',
  'paulescobia.13@gmail.com'
);
