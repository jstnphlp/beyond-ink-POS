-- ═══════════════════════════════════════════════════════════════════
-- Drop service catalog tables from Supabase
-- ═══════════════════════════════════════════════════════════════════
-- Run this AFTER verifying the app works with static catalog data.
-- These tables are no longer queried by the application.
--
-- NOTE: sales_service_lines.service_id and sales_add_on_entries.add_on_id
-- have FK constraints pointing to the tables we're dropping.
-- We drop those constraints first (the text columns service_name and
-- add_on_name already store the human-readable names).
-- ═══════════════════════════════════════════════════════════════════

-- 1. Drop FK from sales_service_lines → services
ALTER TABLE public.sales_service_lines
  DROP CONSTRAINT IF EXISTS sales_service_lines_service_id_fkey;

-- 2. Drop FK from sales_add_on_entries → add_ons
ALTER TABLE public.sales_add_on_entries
  DROP CONSTRAINT IF EXISTS sales_add_on_entries_add_on_id_fkey;

-- 3. Drop the pricing junction table (depends on services + inventory_items)
DROP TABLE IF EXISTS public.service_material_prices;

-- 4. Drop the services table (depends on service_categories)
DROP TABLE IF EXISTS public.services;

-- 5. Drop the service categories table
DROP TABLE IF EXISTS public.service_categories;

-- 6. Drop the add-ons table
DROP TABLE IF EXISTS public.add_ons;
