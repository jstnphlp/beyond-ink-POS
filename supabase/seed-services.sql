-- Supabase Seed Script for Inventory Items (Materials)
-- Service categories, services, and pricing are now hardcoded in static-catalog.ts.
-- This script only seeds the inventory_items table (the only catalog table still in Supabase).
-- Run this in your Supabase SQL Editor.

DO $$
DECLARE
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
    m_lam_id         UUID := 'c0000000-0000-0000-0000-000000000030';
    m_lam_half       UUID := 'c0000000-0000-0000-0000-000000000031';
    m_lam_a4         UUID := 'c0000000-0000-0000-0000-000000000032';
    m_sintra_board   UUID := 'c0000000-0000-0000-0000-000000000014';
    m_cardstock      UUID := 'c0000000-0000-0000-0000-000000000015';
    m_brochure_paper UUID := 'c0000000-0000-0000-0000-000000000016';
    m_specialty_board UUID := 'c0000000-0000-0000-0000-000000000017';
    m_digital_output UUID := 'c0000000-0000-0000-0000-000000000005';

    -- Magazine Printing materials
    m_mag_glossy_a4  UUID := 'c0000000-0000-0000-0000-000000000040';
    m_mag_matte_a4   UUID := 'c0000000-0000-0000-0000-000000000041';
    m_mag_glossy_a5  UUID := 'c0000000-0000-0000-0000-000000000042';
    m_mag_matte_a5   UUID := 'c0000000-0000-0000-0000-000000000043';

-- Book Binding materials
     m_spiral_coil    UUID := 'c0000000-0000-0000-0000-000000000050';
     m_tape_bind      UUID := 'c0000000-0000-0000-0000-000000000051';
     m_saddle_staple  UUID := 'c0000000-0000-0000-0000-000000000052';
     m_hard_cover     UUID := 'c0000000-0000-0000-0000-000000000053';
     m_staple_bind    UUID := 'c0000000-0000-0000-0000-000000000054';

BEGIN

    -- ═══════════════════════════════════════
    -- Inventory Items (Materials)
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
        (m_lam_id,         'Laminating Film - ID Size',                'piece'),
        (m_lam_half,       'Laminating Film - Half A4/Letter',         'piece'),
        (m_lam_a4,         'Laminating Film - A4/Letter',              'piece'),
        (m_cardstock,      'Cardstock (250-340gsm)',                   'sheet'),
        (m_brochure_paper, 'Glossy/Matte Brochure Paper (100-115gsm)','sheet'),
        (m_specialty_board,'Specialty Board (200gsm)',                  'sheet'),
        (m_digital_output, 'Digital Output (No Material)',             'service'),

        -- Magazine Printing materials
        (m_mag_glossy_a4,  'Glossy Magazine Paper - A4 (130gsm)',     'sheet'),
        (m_mag_matte_a4,   'Matte Magazine Paper - A4 (130gsm)',      'sheet'),
        (m_mag_glossy_a5,  'Glossy Magazine Paper - A5 (130gsm)',     'sheet'),
        (m_mag_matte_a5,   'Matte Magazine Paper - A5 (130gsm)',      'sheet'),

-- Book Binding materials
         (m_spiral_coil,    'Spiral/Coil Ring Binder',                 'piece'),
         (m_tape_bind,      'Tape Binding Strip',                      'piece'),
         (m_saddle_staple,  'Saddle-Stitch Staple Set',                'set'),
         (m_hard_cover,     'Hard-Bound Cover Set',                    'set'),
         (m_staple_bind,    'Staple Binding Set',                      'set')
    ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, unit = EXCLUDED.unit;

END $$;
