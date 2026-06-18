-- Migration 004: Seed all department-specific services
-- Run AFTER 003. Tables are freshly recreated, so we insert everything.

-- ============================================================
-- 1. Insert physical_dept categories
-- ============================================================

INSERT INTO public.service_categories (id, name, department, is_active) VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Standard Printing',  'physical_dept', true),
  ('a0000000-0000-0000-0000-000000000002', 'Photo Printing',     'physical_dept', true),
  ('a0000000-0000-0000-0000-000000000003', 'Sticker Printing',   'physical_dept', true),
  ('a0000000-0000-0000-0000-000000000004', 'Others',             'physical_dept', true),
  ('a0000000-0000-0000-0000-000000000006', 'Magazine Printing',  'physical_dept', true),
  ('a0000000-0000-0000-0000-000000000007', 'Book Binding',       'physical_dept', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 2. Insert design_dept categories
-- ============================================================

INSERT INTO public.service_categories (id, name, department, is_active) VALUES
  ('a0000000-0000-0000-0000-000000000005', 'Advanced Services',  'design_dept', true),
  ('a0000000-0000-0000-0000-000000000010', 'Graphic Design',     'design_dept', true),
  ('a0000000-0000-0000-0000-000000000011', 'Video & Multimedia', 'design_dept', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 3. Insert dev_dept categories
-- ============================================================

INSERT INTO public.service_categories (id, name, department, is_active) VALUES
  ('a0000000-0000-0000-0000-000000000020', 'Web Development',    'dev_dept', true),
  ('a0000000-0000-0000-0000-000000000021', 'Software Solutions',  'dev_dept', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 4. Insert physical_dept services
-- ============================================================

INSERT INTO public.services (id, name, category_id, is_active) VALUES
  -- Standard Printing
  ('b0000000-0000-0000-0000-000000000040', 'Standard Printing (Black)',   'a0000000-0000-0000-0000-000000000001', true),
  ('b0000000-0000-0000-0000-000000000041', 'Standard Printing (Colored)', 'a0000000-0000-0000-0000-000000000001', true),
  ('b0000000-0000-0000-0000-000000000042', 'Photocopy / Xerox (Black)',   'a0000000-0000-0000-0000-000000000001', true),
  ('b0000000-0000-0000-0000-000000000043', 'Photocopy / Xerox (Colored)', 'a0000000-0000-0000-0000-000000000001', true),
  ('b0000000-0000-0000-0000-000000000003', 'Scanning',                    'a0000000-0000-0000-0000-000000000001', true),
  ('b0000000-0000-0000-0000-000000000045', 'Hot Laminating',              'a0000000-0000-0000-0000-000000000001', true),
  ('b0000000-0000-0000-0000-000000000046', 'Phototop/Coldtop',            'a0000000-0000-0000-0000-000000000001', true),
  -- Photo Printing
  ('b0000000-0000-0000-0000-000000000010', '3R Photo Print',  'a0000000-0000-0000-0000-000000000002', true),
  ('b0000000-0000-0000-0000-000000000011', '4R Photo Print',  'a0000000-0000-0000-0000-000000000002', true),
  ('b0000000-0000-0000-0000-000000000012', 'A4 Photo Print',  'a0000000-0000-0000-0000-000000000002', true),
  ('b0000000-0000-0000-0000-000000000004', 'Rush ID',         'a0000000-0000-0000-0000-000000000002', true),
  -- Sticker Printing
  ('b0000000-0000-0000-0000-000000000007', 'Custom Stickers/Labels',  'a0000000-0000-0000-0000-000000000003', true),
  ('b0000000-0000-0000-0000-000000000036', 'Sticker on Sintra Board', 'a0000000-0000-0000-0000-000000000003', true),
  -- Others
  ('b0000000-0000-0000-0000-000000000020', 'Certificates & Award',      'a0000000-0000-0000-0000-000000000004', true),
  ('b0000000-0000-0000-0000-000000000021', 'Flyers/Tri-Fold Brochures', 'a0000000-0000-0000-0000-000000000004', true),
  ('b0000000-0000-0000-0000-000000000022', 'Business Cards',            'a0000000-0000-0000-0000-000000000004', true),
  ('b0000000-0000-0000-0000-000000000023', 'Simple Editing',            'a0000000-0000-0000-0000-000000000004', true),
  -- Magazine Printing
  ('b0000000-0000-0000-0000-000000000050', 'Magazine (A4, Colored)',       'a0000000-0000-0000-0000-000000000006', true),
  ('b0000000-0000-0000-0000-000000000051', 'Magazine (A5, Colored)',       'a0000000-0000-0000-0000-000000000006', true),
  ('b0000000-0000-0000-0000-000000000052', 'Magazine (A4, Black & White)', 'a0000000-0000-0000-0000-000000000006', true),
  -- Book Binding
  ('b0000000-0000-0000-0000-000000000060', 'Spiral/Coil Binding',  'a0000000-0000-0000-0000-000000000007', true),
  ('b0000000-0000-0000-0000-000000000061', 'Tape Binding',         'a0000000-0000-0000-0000-000000000007', true),
  ('b0000000-0000-0000-0000-000000000062', 'Saddle-Stitch Binding','a0000000-0000-0000-0000-000000000007', true),
  ('b0000000-0000-0000-0000-000000000063', 'Hard-Bound Binding',   'a0000000-0000-0000-0000-000000000007', true),
  ('b0000000-0000-0000-0000-000000000064', 'Staple Binding',       'a0000000-0000-0000-0000-000000000007', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 5. Insert design_dept services
-- ============================================================

INSERT INTO public.services (id, name, category_id, is_active) VALUES
  -- Advanced Services (design_dept)
  ('b0000000-0000-0000-0000-000000000030', 'Typing',           'a0000000-0000-0000-0000-000000000005', true),
  ('b0000000-0000-0000-0000-000000000031', 'Research',         'a0000000-0000-0000-0000-000000000005', true),
  ('b0000000-0000-0000-0000-000000000032', 'Layout Design',    'a0000000-0000-0000-0000-000000000005', true),
  ('b0000000-0000-0000-0000-000000000033', 'Photo Editing',    'a0000000-0000-0000-0000-000000000005', true),
  ('b0000000-0000-0000-0000-000000000034', 'Video Editing',    'a0000000-0000-0000-0000-000000000005', true),
  ('b0000000-0000-0000-0000-000000000035', 'Website Services', 'a0000000-0000-0000-0000-000000000005', true),
  -- Graphic Design
  ('b0000000-0000-0000-0000-000000000070', 'Logo Design',             'a0000000-0000-0000-0000-000000000010', true),
  ('b0000000-0000-0000-0000-000000000071', 'Brand Identity Package',  'a0000000-0000-0000-0000-000000000010', true),
  ('b0000000-0000-0000-0000-000000000072', 'Social Media Graphics',   'a0000000-0000-0000-0000-000000000010', true),
  ('b0000000-0000-0000-0000-000000000073', 'Poster/Flyer Design',     'a0000000-0000-0000-0000-000000000010', true),
  ('b0000000-0000-0000-0000-000000000074', 'UI/UX Design',            'a0000000-0000-0000-0000-000000000010', true),
  -- Video & Multimedia
  ('b0000000-0000-0000-0000-000000000075', 'Motion Graphics',  'a0000000-0000-0000-0000-000000000011', true),
  ('b0000000-0000-0000-0000-000000000076', 'Video Production', 'a0000000-0000-0000-0000-000000000011', true),
  ('b0000000-0000-0000-0000-000000000077', 'Animation',        'a0000000-0000-0000-0000-000000000011', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 6. Insert dev_dept services
-- ============================================================

INSERT INTO public.services (id, name, category_id, is_active) VALUES
  -- Web Development
  ('b0000000-0000-0000-0000-000000000080', 'Business Website',     'a0000000-0000-0000-0000-000000000020', true),
  ('b0000000-0000-0000-0000-000000000081', 'E-commerce Site',      'a0000000-0000-0000-0000-000000000020', true),
  ('b0000000-0000-0000-0000-000000000082', 'Landing Page',         'a0000000-0000-0000-0000-000000000020', true),
  ('b0000000-0000-0000-0000-000000000083', 'Web Application',      'a0000000-0000-0000-0000-000000000020', true),
  -- Software Solutions
  ('b0000000-0000-0000-0000-000000000084', 'Custom Software',       'a0000000-0000-0000-0000-000000000021', true),
  ('b0000000-0000-0000-0000-000000000085', 'API Integration',       'a0000000-0000-0000-0000-000000000021', true),
  ('b0000000-0000-0000-0000-000000000086', 'Database Setup',        'a0000000-0000-0000-0000-000000000021', true),
  ('b0000000-0000-0000-0000-000000000087', 'Technical Consultation','a0000000-0000-0000-0000-000000000021', true)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 7. Re-add FK constraints (now that services + add_ons are seeded)
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_service_lines_service_id_fkey'
  ) THEN
    ALTER TABLE public.sales_service_lines
      ADD CONSTRAINT sales_service_lines_service_id_fkey
      FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE RESTRICT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'sales_add_on_entries_add_on_id_fkey'
  ) THEN
    ALTER TABLE public.sales_add_on_entries
      ADD CONSTRAINT sales_add_on_entries_add_on_id_fkey
      FOREIGN KEY (add_on_id) REFERENCES public.add_ons(id) ON DELETE RESTRICT;
  END IF;
END $$;
