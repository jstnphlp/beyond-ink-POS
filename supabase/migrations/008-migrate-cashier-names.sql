-- Migration 008: Migrate legacy cashier names to current ones
-- Current valid names: Buknoy, Mark, Paul, Philip
--
-- Legacy mapping (case-insensitive):
--   bot, Bot       → Paul
--   buknoy         → Buknoy
--   bok, BOK       → Buknoy
--   buk            → Buknoy
--   mark           → Mark
--   lip            → Philip
--   bot/lip        → Paul, Philip
--   bok/mark       → Buknoy, Mark

-- ─── 1. Update the cashier_name column ────────────────────────────────

UPDATE public.sales_transactions
SET cashier_name = CASE
  WHEN LOWER(cashier_name) = 'bot'        THEN 'Paul'
  WHEN LOWER(cashier_name) = 'buknoy'     THEN 'Buknoy'
  WHEN LOWER(cashier_name) = 'bok'        THEN 'Buknoy'
  WHEN LOWER(cashier_name) = 'buk'        THEN 'Buknoy'
  WHEN LOWER(cashier_name) = 'mark'       THEN 'Mark'
  WHEN LOWER(cashier_name) = 'lip'        THEN 'Philip'
  WHEN LOWER(cashier_name) = 'bot/lip'    THEN 'Paul, Philip'
  WHEN LOWER(cashier_name) = 'bok/mark'   THEN 'Buknoy, Mark'
  ELSE cashier_name
END
WHERE LOWER(cashier_name) NOT IN ('buknoy', 'mark', 'paul', 'philip');

-- ─── 2. Update the draft_payload JSONB to stay in sync ───────────────

UPDATE public.sales_transactions
SET draft_payload = jsonb_set(
  draft_payload,
  '{cashierName}',
  to_jsonb(CASE
    WHEN LOWER(draft_payload->>'cashierName') = 'bot'        THEN 'Paul'
    WHEN LOWER(draft_payload->>'cashierName') = 'buknoy'     THEN 'Buknoy'
    WHEN LOWER(draft_payload->>'cashierName') = 'bok'        THEN 'Buknoy'
    WHEN LOWER(draft_payload->>'cashierName') = 'buk'        THEN 'Buknoy'
    WHEN LOWER(draft_payload->>'cashierName') = 'mark'       THEN 'Mark'
    WHEN LOWER(draft_payload->>'cashierName') = 'lip'        THEN 'Philip'
    WHEN LOWER(draft_payload->>'cashierName') = 'bot/lip'    THEN 'Paul, Philip'
    WHEN LOWER(draft_payload->>'cashierName') = 'bok/mark'   THEN 'Buknoy, Mark'
    ELSE draft_payload->>'cashierName'
  END)
)
WHERE LOWER(draft_payload->>'cashierName') NOT IN ('buknoy', 'mark', 'paul', 'philip');

-- ─── 3. Verify: should return 0 rows ─────────────────────────────────

SELECT DISTINCT cashier_name
FROM public.sales_transactions
WHERE LOWER(cashier_name) NOT IN ('buknoy', 'mark', 'paul', 'philip');
