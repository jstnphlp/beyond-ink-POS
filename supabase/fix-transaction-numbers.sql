-- Run this script in your Supabase SQL Editor to fix the transaction numbering.

-- Step 1: Renumber all existing transactions to start exactly from 1
WITH numbered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as new_num
  FROM public.sales_transactions
)
UPDATE public.sales_transactions
SET transaction_number = numbered.new_num
FROM numbered
WHERE public.sales_transactions.id = numbered.id;

-- Step 2: Remove the default auto-increment sequence so we can use our custom logic
ALTER TABLE public.sales_transactions ALTER COLUMN transaction_number DROP IDENTITY IF EXISTS;

-- Step 3: Create a function that finds the lowest available transaction number (filling gaps)
CREATE OR REPLACE FUNCTION public.set_next_transaction_number()
RETURNS TRIGGER AS $$
DECLARE
  next_num BIGINT;
BEGIN
  IF NEW.transaction_number IS NULL THEN
    -- Find the lowest available number starting from 1
    SELECT COALESCE(MIN(t1.transaction_number + 1), 1) INTO next_num
    FROM (
      SELECT 0 AS transaction_number
      UNION ALL
      SELECT transaction_number FROM public.sales_transactions
    ) t1
    LEFT JOIN public.sales_transactions t2 ON t1.transaction_number + 1 = t2.transaction_number
    WHERE t2.transaction_number IS NULL;

    NEW.transaction_number := next_num;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Attach the trigger to run before every new sale is inserted
DROP TRIGGER IF EXISTS trg_set_next_transaction_number ON public.sales_transactions;
CREATE TRIGGER trg_set_next_transaction_number
BEFORE INSERT ON public.sales_transactions
FOR EACH ROW
EXECUTE FUNCTION public.set_next_transaction_number();
