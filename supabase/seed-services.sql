-- Supabase Seed Script for Service Categories, Services, Inventory Items (Materials), and Prices
-- Based on "print - Sheet1.pdf" and "services (1).pdf"
-- Run this in your Supabase SQL Editor.

-- Step 0: Add category_id column if it doesn't exist yet
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'services' AND column_name = 'category_id'
  ) THEN
    CREATE TABLE IF NOT EXISTS public.service_categories (
      id uuid primary key default gen_random_uuid(),
      name text not null,
      is_active boolean not null default true,
      created_at timestamptz not null default timezone('utc', now())
    );
    ALTER TABLE public.service_categories ENABLE ROW LEVEL SECURITY;
    DROP POLICY IF EXISTS "service_categories_all_authenticated" ON public.service_categories;
    CREATE POLICY "service_categories_all_authenticated" ON public.service_categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

    ALTER TABLE public.services ADD COLUMN category_id uuid REFERENCES public.service_categories(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$
DECLARE
    -- ═══════════════════════════════════════
    -- Category IDs
    -- ═══════════════════════════════════════
    cat_standard_printing UUID := 'a0000000-0000-0000-0000-000000000001';
    cat_photo_printing    UUID := 'a0000000-0000-0000-0000-000000000002';
    cat_sticker_printing  UUID := 'a0000000-0000-0000-0000-000000000003';
    cat_others            UUID := 'a0000000-0000-0000-0000-000000000004';
    cat_advanced          UUID := 'a0000000-0000-0000-0000-000000000005';

    -- ═══════════════════════════════════════
    -- Service IDs
    -- ═══════════════════════════════════════
    -- Standard Printing (category) sub-services
    s_standard_printing UUID := 'b0000000-0000-0000-0000-000000000001';
    s_photocopy         UUID := 'b0000000-0000-0000-0000-000000000002';
    s_scanning          UUID := 'b0000000-0000-0000-0000-000000000003';
    s_laminating        UUID := 'b0000000-0000-0000-0000-000000000005';

    -- Photo Printing (category) sub-services
    s_3r_photo  UUID := 'b0000000-0000-0000-0000-000000000010';
    s_4r_photo  UUID := 'b0000000-0000-0000-0000-000000000011';
    s_a4_photo  UUID := 'b0000000-0000-0000-0000-000000000012';
    s_rush_id   UUID := 'b0000000-0000-0000-0000-000000000004';

    -- Sticker Printing (category) sub-services
    s_custom_stickers UUID := 'b0000000-0000-0000-0000-000000000007';
    s_sintra_sticker  UUID := 'b0000000-0000-0000-0000-000000000036';

    -- Others (category) sub-services
    s_certificates   UUID := 'b0000000-0000-0000-0000-000000000020';
    s_flyers         UUID := 'b0000000-0000-0000-0000-000000000021';
    s_business_cards UUID := 'b0000000-0000-0000-0000-000000000022';

    -- Advanced Services (category) sub-services
    s_typing         UUID := 'b0000000-0000-0000-0000-000000000030';
    s_research       UUID := 'b0000000-0000-0000-0000-000000000031';
    s_layout_design  UUID := 'b0000000-0000-0000-0000-000000000032';
    s_photo_editing  UUID := 'b0000000-0000-0000-0000-000000000033';
    s_video_editing  UUID := 'b0000000-0000-0000-0000-000000000034';
    s_website        UUID := 'b0000000-0000-0000-0000-000000000035';

    -- Old generic services to deactivate
    s_old_photo_printing    UUID := 'b0000000-0000-0000-0000-000000000006';
    s_old_others            UUID := 'b0000000-0000-0000-0000-000000000008';
    s_old_advanced_services UUID := 'b0000000-0000-0000-0000-000000000009';

    -- ═══════════════════════════════════════
    -- Inventory Item (Material) IDs
    -- ═══════════════════════════════════════
    m_bond_short     UUID := 'c0000000-0000-0000-0000-000000000001';
    m_bond_a4        UUID := 'c0000000-0000-0000-0000-000000000002';
    m_bond_long      UUID := 'c0000000-0000-0000-0000-000000000003';
    m_photo_paper_3r UUID := 'c0000000-0000-0000-0000-000000000010';
    m_photo_paper_4r UUID := 'c0000000-0000-0000-0000-000000000011';
    m_photo_paper_a4 UUID := 'c0000000-0000-0000-0000-000000000012';
    m_vinyl_sticker  UUID := 'c0000000-0000-0000-0000-000000000013';
    m_sticker_matte  UUID := 'c0000000-0000-0000-0000-000000000023';
    m_sticker_glossy UUID := 'c0000000-0000-0000-0000-000000000024';
    m_laminate_film  UUID := 'c0000000-0000-0000-0000-000000000029';
    m_sintra_board   UUID := 'c0000000-0000-0000-0000-000000000014';
    m_cardstock      UUID := 'c0000000-0000-0000-0000-000000000015';
    m_brochure_paper UUID := 'c0000000-0000-0000-0000-000000000016';
    m_specialty_board UUID := 'c0000000-0000-0000-0000-000000000017';
    m_digital_output UUID := 'c0000000-0000-0000-0000-000000000005';

BEGIN

    -- ═══════════════════════════════════════
    -- 1. Service Categories
    -- ═══════════════════════════════════════
    INSERT INTO public.service_categories (id, name, is_active) VALUES
        (cat_standard_printing, 'Standard Printing', true),
        (cat_photo_printing, 'Photo Printing', true),
        (cat_sticker_printing, 'Sticker Printing', true),
        (cat_others, 'Others', true),
        (cat_advanced, 'Advanced Services', true)
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, is_active = EXCLUDED.is_active;

    -- ═══════════════════════════════════════
    -- 2. Services (specific sub-services under each category)
    -- ═══════════════════════════════════════
    INSERT INTO public.services (id, name, category_id, is_active) VALUES
        -- Standard Printing
        (s_standard_printing, 'Standard Printing',  cat_standard_printing, true),
        (s_photocopy,         'Photocopy / Xerox',  cat_standard_printing, true),
        (s_scanning,          'Scanning',           cat_standard_printing, true),
        (s_laminating,        'Laminating',         cat_standard_printing, true),

        -- Photo Printing
        (s_3r_photo,  '3R Photo Print',  cat_photo_printing, true),
        (s_4r_photo,  '4R Photo Print',  cat_photo_printing, true),
        (s_a4_photo,  'A4 Photo Print',  cat_photo_printing, true),
        (s_rush_id,   'Rush ID',         cat_photo_printing, true),

        -- Sticker Printing
        (s_custom_stickers, 'Custom Stickers/Labels',    cat_sticker_printing, true),
        (s_sintra_sticker,  'Sticker on Sintra Board',   cat_sticker_printing, true),

        -- Others
        (s_certificates,   'Certificates & Award',       cat_others, true),
        (s_flyers,         'Flyers/Tri-Fold Brochures',  cat_others, true),
        (s_business_cards, 'Business Cards',             cat_others, true),

        -- Advanced Services
        (s_typing,        'Typing',           cat_advanced, true),
        (s_research,      'Research',         cat_advanced, true),
        (s_layout_design, 'Layout Design',    cat_advanced, true),
        (s_photo_editing, 'Photo Editing',    cat_advanced, true),
        (s_video_editing, 'Video Editing',    cat_advanced, true),
        (s_website,       'Website Services', cat_advanced, true)
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, category_id = EXCLUDED.category_id, is_active = EXCLUDED.is_active;

    -- Deactivate old generic services that have been replaced by specific ones
    UPDATE public.services SET is_active = false WHERE id IN (s_old_photo_printing, s_old_others, s_old_advanced_services);

    -- ═══════════════════════════════════════
    -- 3. Inventory Items (Materials)
    -- ═══════════════════════════════════════
    INSERT INTO public.inventory_items (id, name, unit) VALUES
        (m_bond_short,     'Bond Paper - Short (70-80gsm)',             'sheet'),
        (m_bond_a4,        'Bond Paper - A4 (70-80gsm)',               'sheet'),
        (m_bond_long,      'Bond Paper - Long (70-80gsm)',             'sheet'),
        (m_photo_paper_3r, 'Glossy Photo Paper - 3R (260gsm)',         'sheet'),
        (m_photo_paper_4r, 'Glossy Photo Paper - 4R (260gsm)',         'sheet'),
        (m_photo_paper_a4, 'Glossy Photo Paper - A4 (200-260gsm)',     'sheet'),
        (m_vinyl_sticker,  'Inkjet Vinyl Sticker - A4 Matte',         'sheet'),
        (m_sticker_matte,  'Sticker Paper - A4 Matte (135gsm)',       'sheet'),
        (m_sticker_glossy, 'Sticker Paper - A4 Glossy (135gsm)',      'sheet'),
        (m_sintra_board,   'Sintra Board - A4 (3mm)',                  'sheet'),
        (m_laminate_film,  'Laminate Film',                            'sheet'),
        (m_cardstock,      'Cardstock (250-340gsm)',                   'sheet'),
        (m_brochure_paper, 'Glossy/Matte Brochure Paper (100-115gsm)','sheet'),
        (m_specialty_board,'Specialty Board (200gsm)',                  'sheet'),
        (m_digital_output, 'Digital Output (No Material)',             'service')
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, unit = EXCLUDED.unit;

    -- ═══════════════════════════════════════
    -- 4. Service → Material → Price links
    -- ═══════════════════════════════════════
    DELETE FROM public.service_material_prices;

    INSERT INTO public.service_material_prices (service_id, inventory_item_id, suggested_unit_price) VALUES
        -- Standard Printing: B&W ₱4 / Colored ₱7 per page
        (s_standard_printing, m_bond_short, 4.00),
        (s_standard_printing, m_bond_a4,    4.00),
        (s_standard_printing, m_bond_long,  4.00),

        -- Photocopy / Xerox: B&W ₱2 / Colored ₱7
        (s_photocopy, m_bond_short, 2.00),
        (s_photocopy, m_bond_a4,    2.00),
        (s_photocopy, m_bond_long,  2.00),

        -- Scanning: ₱10 per page
        (s_scanning, m_digital_output, 10.00),

        -- Laminating: ₱20
        (s_laminating, m_laminate_film, 20.00),

        -- Photo Printing
        (s_3r_photo, m_photo_paper_3r, 8.00),
        (s_4r_photo, m_photo_paper_4r, 30.00),
        (s_a4_photo, m_photo_paper_a4, 50.00),

        -- Rush ID: ₱50 (uses 4R photo paper)
        (s_rush_id, m_photo_paper_4r, 50.00),

        -- Custom Stickers/Labels: ₱45 per A4 sheet
        (s_custom_stickers, m_vinyl_sticker,  45.00),
        (s_custom_stickers, m_sticker_matte,  45.00),
        (s_custom_stickers, m_sticker_glossy, 45.00),

        -- Sticker on Sintra Board: ₱150 A4 size
        (s_sintra_sticker, m_sintra_board, 150.00),

        -- Certificates & Award: ₱25/pc
        (s_certificates, m_specialty_board, 25.00),

        -- Flyers/Tri-Fold Brochures: ₱50/pc
        (s_flyers, m_brochure_paper, 50.00),

        -- Business Cards: ₱50/set (10pcs)
        (s_business_cards, m_cardstock, 50.00),

        -- Typing: ₱40/page
        (s_typing, m_digital_output, 40.00),

        -- Research: ₱80/page
        (s_research, m_digital_output, 80.00),

        -- Layout Design: min ₱150
        (s_layout_design, m_digital_output, 150.00),

        -- Photo Editing: min ₱150
        (s_photo_editing, m_digital_output, 150.00),

        -- Video Editing: min ₱150
        (s_video_editing, m_digital_output, 150.00),

        -- Website Services: consultation (₱0 placeholder)
        (s_website, m_digital_output, 0.00);

END $$;
