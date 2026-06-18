-- Migration 004: Seed department-specific services
-- Assigns existing service categories to departments and creates new design/dev categories.

-- ============================================================
-- 1. Assign existing categories to physical_dept
-- ============================================================

UPDATE public.service_categories
SET department = 'physical_dept'
WHERE id IN (
  'a0000000-0000-0000-0000-000000000001',  -- Standard Printing
  'a0000000-0000-0000-0000-000000000002',  -- Photo Printing
  'a0000000-0000-0000-0000-000000000003',  -- Sticker Printing
  'a0000000-0000-0000-0000-000000000004',  -- Others
  'a0000000-0000-0000-0000-000000000006',  -- Magazine Printing
  'a0000000-0000-0000-0000-000000000007'   -- Book Binding
);

-- ============================================================
-- 2. Reassign Advanced Services category to design_dept
-- ============================================================

UPDATE public.service_categories
SET department = 'design_dept'
WHERE id = 'a0000000-0000-0000-0000-000000000005';  -- Advanced Services

-- ============================================================
-- 3. Create new design_dept categories
-- ============================================================

INSERT INTO public.service_categories (id, name, department, is_active) VALUES
  ('a0000000-0000-0000-0000-000000000010', 'Graphic Design', 'design_dept', true),
  ('a0000000-0000-0000-0000-000000000011', 'Video & Multimedia', 'design_dept', true)
ON CONFLICT (id) DO UPDATE SET department = 'design_dept', name = EXCLUDED.name;

-- ============================================================
-- 4. Create new dev_dept categories
-- ============================================================

INSERT INTO public.service_categories (id, name, department, is_active) VALUES
  ('a0000000-0000-0000-0000-000000000020', 'Web Development', 'dev_dept', true),
  ('a0000000-0000-0000-0000-000000000021', 'Software Solutions', 'dev_dept', true)
ON CONFLICT (id) DO UPDATE SET department = 'dev_dept', name = EXCLUDED.name;

-- ============================================================
-- 5. Create new design_dept services
-- ============================================================

INSERT INTO public.services (id, name, category_id, is_active) VALUES
  ('b0000000-0000-0000-0000-000000000070', 'Logo Design', 'a0000000-0000-0000-0000-000000000010', true),
  ('b0000000-0000-0000-0000-000000000071', 'Brand Identity Package', 'a0000000-0000-0000-0000-000000000010', true),
  ('b0000000-0000-0000-0000-000000000072', 'Social Media Graphics', 'a0000000-0000-0000-0000-000000000010', true),
  ('b0000000-0000-0000-0000-000000000073', 'Poster/Flyer Design', 'a0000000-0000-0000-0000-000000000010', true),
  ('b0000000-0000-0000-0000-000000000074', 'UI/UX Design', 'a0000000-0000-0000-0000-000000000010', true),
  ('b0000000-0000-0000-0000-000000000075', 'Motion Graphics', 'a0000000-0000-0000-0000-000000000011', true),
  ('b0000000-0000-0000-0000-000000000076', 'Video Production', 'a0000000-0000-0000-0000-000000000011', true),
  ('b0000000-0000-0000-0000-000000000077', 'Animation', 'a0000000-0000-0000-0000-000000000011', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id;

-- ============================================================
-- 6. Create new dev_dept services
-- ============================================================

INSERT INTO public.services (id, name, category_id, is_active) VALUES
  ('b0000000-0000-0000-0000-000000000080', 'Business Website', 'a0000000-0000-0000-0000-000000000020', true),
  ('b0000000-0000-0000-0000-000000000081', 'E-commerce Site', 'a0000000-0000-0000-0000-000000000020', true),
  ('b0000000-0000-0000-0000-000000000082', 'Landing Page', 'a0000000-0000-0000-0000-000000000020', true),
  ('b0000000-0000-0000-0000-000000000083', 'Web Application', 'a0000000-0000-0000-0000-000000000020', true),
  ('b0000000-0000-0000-0000-000000000084', 'Custom Software', 'a0000000-0000-0000-0000-000000000021', true),
  ('b0000000-0000-0000-0000-000000000085', 'API Integration', 'a0000000-0000-0000-0000-000000000021', true),
  ('b0000000-0000-0000-0000-000000000086', 'Database Setup', 'a0000000-0000-0000-0000-000000000021', true),
  ('b0000000-0000-0000-0000-000000000087', 'Technical Consultation', 'a0000000-0000-0000-0000-000000000021', true)
ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id;

-- ============================================================
-- 7. Assign existing add_ons to physical_dept
-- ============================================================

UPDATE public.add_ons
SET department = 'physical_dept'
WHERE department IS NULL;
