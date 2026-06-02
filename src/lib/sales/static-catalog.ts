/**
 * Static service catalog for Beyond Ink POS.
 *
 * These were previously stored in Supabase (service_categories, services,
 * add_ons, service_material_prices) but are now hardcoded for speed.
 * UUIDs match the original seed-services.sql so historical transactions
 * remain consistent.
 */

// ─── Service Categories ─────────────────────────────────────────────

export const SERVICE_CATEGORIES: { id: string; name: string }[] = [
  { id: "a0000000-0000-0000-0000-000000000001", name: "Standard Printing" },
  { id: "a0000000-0000-0000-0000-000000000002", name: "Photo Printing" },
  { id: "a0000000-0000-0000-0000-000000000003", name: "Sticker Printing" },
  { id: "a0000000-0000-0000-0000-000000000004", name: "Others" },
  { id: "a0000000-0000-0000-0000-000000000005", name: "Advanced Services" },
  { id: "a0000000-0000-0000-0000-000000000006", name: "Magazine Printing" },
  { id: "a0000000-0000-0000-0000-000000000007", name: "Book Binding" },
];

// ─── Services ────────────────────────────────────────────────────────

export const SERVICES: {
  id: string;
  name: string;
  is_active: boolean;
  category_id: string | null;
}[] = [
  // Standard Printing
  { id: "b0000000-0000-0000-0000-000000000040", name: "Standard Printing (Black)",   is_active: true, category_id: "a0000000-0000-0000-0000-000000000001" },
  { id: "b0000000-0000-0000-0000-000000000041", name: "Standard Printing (Colored)", is_active: true, category_id: "a0000000-0000-0000-0000-000000000001" },
  { id: "b0000000-0000-0000-0000-000000000042", name: "Photocopy / Xerox (Black)",   is_active: true, category_id: "a0000000-0000-0000-0000-000000000001" },
  { id: "b0000000-0000-0000-0000-000000000043", name: "Photocopy / Xerox (Colored)", is_active: true, category_id: "a0000000-0000-0000-0000-000000000001" },
  { id: "b0000000-0000-0000-0000-000000000003", name: "Scanning",                    is_active: true, category_id: "a0000000-0000-0000-0000-000000000001" },
  { id: "b0000000-0000-0000-0000-000000000045", name: "Hot Laminating",              is_active: true, category_id: "a0000000-0000-0000-0000-000000000001" },
  { id: "b0000000-0000-0000-0000-000000000046", name: "Phototop/Coldtop",            is_active: true, category_id: "a0000000-0000-0000-0000-000000000001" },

  // Photo Printing
  { id: "b0000000-0000-0000-0000-000000000010", name: "3R Photo Print",  is_active: true, category_id: "a0000000-0000-0000-0000-000000000002" },
  { id: "b0000000-0000-0000-0000-000000000011", name: "4R Photo Print",  is_active: true, category_id: "a0000000-0000-0000-0000-000000000002" },
  { id: "b0000000-0000-0000-0000-000000000012", name: "A4 Photo Print",  is_active: true, category_id: "a0000000-0000-0000-0000-000000000002" },
  { id: "b0000000-0000-0000-0000-000000000004", name: "Rush ID",         is_active: true, category_id: "a0000000-0000-0000-0000-000000000002" },

  // Sticker Printing
  { id: "b0000000-0000-0000-0000-000000000007", name: "Custom Stickers/Labels",  is_active: true, category_id: "a0000000-0000-0000-0000-000000000003" },
  { id: "b0000000-0000-0000-0000-000000000036", name: "Sticker on Sintra Board", is_active: true, category_id: "a0000000-0000-0000-0000-000000000003" },

  // Others
  { id: "b0000000-0000-0000-0000-000000000020", name: "Certificates & Award",      is_active: true, category_id: "a0000000-0000-0000-0000-000000000004" },
  { id: "b0000000-0000-0000-0000-000000000021", name: "Flyers/Tri-Fold Brochures", is_active: true, category_id: "a0000000-0000-0000-0000-000000000004" },
  { id: "b0000000-0000-0000-0000-000000000022", name: "Business Cards",            is_active: true, category_id: "a0000000-0000-0000-0000-000000000004" },
  { id: "b0000000-0000-0000-0000-000000000023", name: "Simple Editing",            is_active: true, category_id: "a0000000-0000-0000-0000-000000000004" },

  // Advanced Services
  { id: "b0000000-0000-0000-0000-000000000030", name: "Typing",           is_active: true, category_id: "a0000000-0000-0000-0000-000000000005" },
  { id: "b0000000-0000-0000-0000-000000000031", name: "Research",         is_active: true, category_id: "a0000000-0000-0000-0000-000000000005" },
  { id: "b0000000-0000-0000-0000-000000000032", name: "Layout Design",    is_active: true, category_id: "a0000000-0000-0000-0000-000000000005" },
  { id: "b0000000-0000-0000-0000-000000000033", name: "Photo Editing",    is_active: true, category_id: "a0000000-0000-0000-0000-000000000005" },
  { id: "b0000000-0000-0000-0000-000000000034", name: "Video Editing",    is_active: true, category_id: "a0000000-0000-0000-0000-000000000005" },
  { id: "b0000000-0000-0000-0000-000000000035", name: "Website Services", is_active: true, category_id: "a0000000-0000-0000-0000-000000000005" },

  // Magazine Printing
  { id: "b0000000-0000-0000-0000-000000000050", name: "Magazine (A4, Colored)",       is_active: true, category_id: "a0000000-0000-0000-0000-000000000006" },
  { id: "b0000000-0000-0000-0000-000000000051", name: "Magazine (A5, Colored)",       is_active: true, category_id: "a0000000-0000-0000-0000-000000000006" },
  { id: "b0000000-0000-0000-0000-000000000052", name: "Magazine (A4, Black & White)", is_active: true, category_id: "a0000000-0000-0000-0000-000000000006" },

// Book Binding
   { id: "b0000000-0000-0000-0000-000000000060", name: "Spiral/Coil Binding",  is_active: true, category_id: "a0000000-0000-0000-0000-000000000007" },
   { id: "b0000000-0000-0000-0000-000000000061", name: "Tape Binding",         is_active: true, category_id: "a0000000-0000-0000-0000-000000000007" },
   { id: "b0000000-0000-0000-0000-000000000062", name: "Saddle-Stitch Binding", is_active: true, category_id: "a0000000-0000-0000-0000-000000000007" },
   { id: "b0000000-0000-0000-0000-000000000063", name: "Hard-Bound Binding",   is_active: true, category_id: "a0000000-0000-0000-0000-000000000007" },
   { id: "b0000000-0000-0000-0000-000000000064", name: "Staple Binding",       is_active: true, category_id: "a0000000-0000-0000-0000-000000000007" },
];

// ─── Add-ons (none currently) ────────────────────────────────────────

export const ADD_ONS: { id: string; name: string; is_active: boolean }[] = [];

// ─── Pricing References (Service → Material → Suggested Price) ───────

export const PRICING_REFERENCES: {
  id: string;
  service_id: string;
  inventory_item_id: string;
  suggested_unit_price: number;
}[] = [
  // Standard Printing (Black): Short/A4 ₱4, Long ₱5
  { id: "p0000000-0000-0000-0000-000000000001", service_id: "b0000000-0000-0000-0000-000000000040", inventory_item_id: "c0000000-0000-0000-0000-000000000001", suggested_unit_price: 4 },
  { id: "p0000000-0000-0000-0000-000000000002", service_id: "b0000000-0000-0000-0000-000000000040", inventory_item_id: "c0000000-0000-0000-0000-000000000002", suggested_unit_price: 4 },
  { id: "p0000000-0000-0000-0000-000000000003", service_id: "b0000000-0000-0000-0000-000000000040", inventory_item_id: "c0000000-0000-0000-0000-000000000003", suggested_unit_price: 5 },

  // Standard Printing (Colored): Short/A4 ₱7, Long ₱8
  { id: "p0000000-0000-0000-0000-000000000004", service_id: "b0000000-0000-0000-0000-000000000041", inventory_item_id: "c0000000-0000-0000-0000-000000000001", suggested_unit_price: 7 },
  { id: "p0000000-0000-0000-0000-000000000005", service_id: "b0000000-0000-0000-0000-000000000041", inventory_item_id: "c0000000-0000-0000-0000-000000000002", suggested_unit_price: 7 },
  { id: "p0000000-0000-0000-0000-000000000006", service_id: "b0000000-0000-0000-0000-000000000041", inventory_item_id: "c0000000-0000-0000-0000-000000000003", suggested_unit_price: 8 },

  // Photocopy / Xerox (Black): Short/A4 ₱2, Long ₱3
  { id: "p0000000-0000-0000-0000-000000000007", service_id: "b0000000-0000-0000-0000-000000000042", inventory_item_id: "c0000000-0000-0000-0000-000000000001", suggested_unit_price: 2 },
  { id: "p0000000-0000-0000-0000-000000000008", service_id: "b0000000-0000-0000-0000-000000000042", inventory_item_id: "c0000000-0000-0000-0000-000000000002", suggested_unit_price: 2 },
  { id: "p0000000-0000-0000-0000-000000000009", service_id: "b0000000-0000-0000-0000-000000000042", inventory_item_id: "c0000000-0000-0000-0000-000000000003", suggested_unit_price: 3 },

  // Photocopy / Xerox (Colored): Short/A4 ₱7, Long ₱8
  { id: "p0000000-0000-0000-0000-000000000010", service_id: "b0000000-0000-0000-0000-000000000043", inventory_item_id: "c0000000-0000-0000-0000-000000000001", suggested_unit_price: 7 },
  { id: "p0000000-0000-0000-0000-000000000011", service_id: "b0000000-0000-0000-0000-000000000043", inventory_item_id: "c0000000-0000-0000-0000-000000000002", suggested_unit_price: 7 },
  { id: "p0000000-0000-0000-0000-000000000012", service_id: "b0000000-0000-0000-0000-000000000043", inventory_item_id: "c0000000-0000-0000-0000-000000000003", suggested_unit_price: 8 },

  // Scanning: ₱10
  { id: "p0000000-0000-0000-0000-000000000013", service_id: "b0000000-0000-0000-0000-000000000003", inventory_item_id: "c0000000-0000-0000-0000-000000000005", suggested_unit_price: 10 },

  // Hot Laminating: ID ₱20, Half ₱35, A4 ₱50
  { id: "p0000000-0000-0000-0000-000000000014", service_id: "b0000000-0000-0000-0000-000000000045", inventory_item_id: "c0000000-0000-0000-0000-000000000030", suggested_unit_price: 20 },
  { id: "p0000000-0000-0000-0000-000000000015", service_id: "b0000000-0000-0000-0000-000000000045", inventory_item_id: "c0000000-0000-0000-0000-000000000031", suggested_unit_price: 35 },
  { id: "p0000000-0000-0000-0000-000000000016", service_id: "b0000000-0000-0000-0000-000000000045", inventory_item_id: "c0000000-0000-0000-0000-000000000032", suggested_unit_price: 50 },

  // Phototop / Coldtop: ID ₱20, Half ₱35, A4 ₱50
  { id: "p0000000-0000-0000-0000-000000000017", service_id: "b0000000-0000-0000-0000-000000000046", inventory_item_id: "c0000000-0000-0000-0000-000000000030", suggested_unit_price: 20 },
  { id: "p0000000-0000-0000-0000-000000000018", service_id: "b0000000-0000-0000-0000-000000000046", inventory_item_id: "c0000000-0000-0000-0000-000000000031", suggested_unit_price: 35 },
  { id: "p0000000-0000-0000-0000-000000000019", service_id: "b0000000-0000-0000-0000-000000000046", inventory_item_id: "c0000000-0000-0000-0000-000000000032", suggested_unit_price: 50 },

  // Photo Printing
  { id: "p0000000-0000-0000-0000-000000000020", service_id: "b0000000-0000-0000-0000-000000000010", inventory_item_id: "c0000000-0000-0000-0000-000000000010", suggested_unit_price: 8 },
  { id: "p0000000-0000-0000-0000-000000000021", service_id: "b0000000-0000-0000-0000-000000000011", inventory_item_id: "c0000000-0000-0000-0000-000000000011", suggested_unit_price: 30 },
  { id: "p0000000-0000-0000-0000-000000000022", service_id: "b0000000-0000-0000-0000-000000000012", inventory_item_id: "c0000000-0000-0000-0000-000000000012", suggested_unit_price: 50 },

  // Rush ID: ₱50 (4R photo paper)
  { id: "p0000000-0000-0000-0000-000000000023", service_id: "b0000000-0000-0000-0000-000000000004", inventory_item_id: "c0000000-0000-0000-0000-000000000011", suggested_unit_price: 50 },

  // Custom Stickers/Labels: ₱45 per A4 sheet (vinyl, matte, glossy)
  { id: "p0000000-0000-0000-0000-000000000024", service_id: "b0000000-0000-0000-0000-000000000007", inventory_item_id: "c0000000-0000-0000-0000-000000000013", suggested_unit_price: 45 },
  { id: "p0000000-0000-0000-0000-000000000025", service_id: "b0000000-0000-0000-0000-000000000007", inventory_item_id: "c0000000-0000-0000-0000-000000000023", suggested_unit_price: 45 },
  { id: "p0000000-0000-0000-0000-000000000026", service_id: "b0000000-0000-0000-0000-000000000007", inventory_item_id: "c0000000-0000-0000-0000-000000000024", suggested_unit_price: 45 },

  // Sticker on Sintra Board: ₱150
  { id: "p0000000-0000-0000-0000-000000000027", service_id: "b0000000-0000-0000-0000-000000000036", inventory_item_id: "c0000000-0000-0000-0000-000000000014", suggested_unit_price: 150 },

  // Certificates & Award: ₱25/pc
  { id: "p0000000-0000-0000-0000-000000000028", service_id: "b0000000-0000-0000-0000-000000000020", inventory_item_id: "c0000000-0000-0000-0000-000000000017", suggested_unit_price: 25 },

  // Flyers/Tri-Fold Brochures: ₱50/pc
  { id: "p0000000-0000-0000-0000-000000000029", service_id: "b0000000-0000-0000-0000-000000000021", inventory_item_id: "c0000000-0000-0000-0000-000000000016", suggested_unit_price: 50 },

  // Business Cards: ₱50/set
  { id: "p0000000-0000-0000-0000-000000000030", service_id: "b0000000-0000-0000-0000-000000000022", inventory_item_id: "c0000000-0000-0000-0000-000000000015", suggested_unit_price: 50 },

  // Simple Editing: ₱20
  { id: "p0000000-0000-0000-0000-000000000031", service_id: "b0000000-0000-0000-0000-000000000023", inventory_item_id: "c0000000-0000-0000-0000-000000000005", suggested_unit_price: 20 },

  // Typing: ₱40/page
  { id: "p0000000-0000-0000-0000-000000000032", service_id: "b0000000-0000-0000-0000-000000000030", inventory_item_id: "c0000000-0000-0000-0000-000000000005", suggested_unit_price: 40 },

  // Research: ₱80/page
  { id: "p0000000-0000-0000-0000-000000000033", service_id: "b0000000-0000-0000-0000-000000000031", inventory_item_id: "c0000000-0000-0000-0000-000000000005", suggested_unit_price: 80 },

  // Layout Design: min ₱150
  { id: "p0000000-0000-0000-0000-000000000034", service_id: "b0000000-0000-0000-0000-000000000032", inventory_item_id: "c0000000-0000-0000-0000-000000000005", suggested_unit_price: 150 },

  // Photo Editing: min ₱150
  { id: "p0000000-0000-0000-0000-000000000035", service_id: "b0000000-0000-0000-0000-000000000033", inventory_item_id: "c0000000-0000-0000-0000-000000000005", suggested_unit_price: 150 },

  // Video Editing: min ₱150
  { id: "p0000000-0000-0000-0000-000000000036", service_id: "b0000000-0000-0000-0000-000000000034", inventory_item_id: "c0000000-0000-0000-0000-000000000005", suggested_unit_price: 150 },

  // Website Services: ₱0 placeholder
  { id: "p0000000-0000-0000-0000-000000000037", service_id: "b0000000-0000-0000-0000-000000000035", inventory_item_id: "c0000000-0000-0000-0000-000000000005", suggested_unit_price: 0 },

  // Magazine Printing (A4, Colored): Glossy Magazine Paper A4 ₱15/page
  { id: "p0000000-0000-0000-0000-000000000040", service_id: "b0000000-0000-0000-0000-000000000050", inventory_item_id: "c0000000-0000-0000-0000-000000000040", suggested_unit_price: 15 },
  // Magazine Printing (A4, Colored): Matte Magazine Paper A4 ₱12/page
  { id: "p0000000-0000-0000-0000-000000000041", service_id: "b0000000-0000-0000-0000-000000000050", inventory_item_id: "c0000000-0000-0000-0000-000000000041", suggested_unit_price: 12 },

  // Magazine Printing (A5, Colored): Glossy Magazine Paper A5 ₱10/page
  { id: "p0000000-0000-0000-0000-000000000042", service_id: "b0000000-0000-0000-0000-000000000051", inventory_item_id: "c0000000-0000-0000-0000-000000000042", suggested_unit_price: 10 },
  // Magazine Printing (A5, Colored): Matte Magazine Paper A5 ₱8/page
  { id: "p0000000-0000-0000-0000-000000000043", service_id: "b0000000-0000-0000-0000-000000000051", inventory_item_id: "c0000000-0000-0000-0000-000000000043", suggested_unit_price: 8 },

  // Magazine Printing (A4, Black & White): Bond Paper A4 ₱5/page
  { id: "p0000000-0000-0000-0000-000000000044", service_id: "b0000000-0000-0000-0000-000000000052", inventory_item_id: "c0000000-0000-0000-0000-000000000002", suggested_unit_price: 5 },

  // Spiral/Coil Binding: ₱50 per book
  { id: "p0000000-0000-0000-0000-000000000050", service_id: "b0000000-0000-0000-0000-000000000060", inventory_item_id: "c0000000-0000-0000-0000-000000000050", suggested_unit_price: 50 },
  // Tape Binding: ₱40 per book
  { id: "p0000000-0000-0000-0000-000000000051", service_id: "b0000000-0000-0000-0000-000000000061", inventory_item_id: "c0000000-0000-0000-0000-000000000051", suggested_unit_price: 40 },
// Saddle-Stitch Binding: ₱30 per book
   { id: "p0000000-0000-0000-0000-000000000052", service_id: "b0000000-0000-0000-0000-000000000062", inventory_item_id: "c0000000-0000-0000-0000-000000000052", suggested_unit_price: 30 },
   // Staple Binding: ₱25 per book
   { id: "p0000000-0000-0000-0000-000000000054", service_id: "b0000000-0000-0000-0000-000000000064", inventory_item_id: "c0000000-0000-0000-0000-000000000054", suggested_unit_price: 25 },
   // Hard-Bound Binding: ₱250 per book
  { id: "p0000000-0000-0000-0000-000000000053", service_id: "b0000000-0000-0000-0000-000000000063", inventory_item_id: "c0000000-0000-0000-0000-000000000053", suggested_unit_price: 250 },
];
