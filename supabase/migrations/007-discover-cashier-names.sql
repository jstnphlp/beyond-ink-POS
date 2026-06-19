-- Discovery query: list all distinct cashier_name values in the database.
-- Run this first in the Supabase SQL Editor to see what legacy names exist,
-- then use the results to build the UPDATE statements in 008-migrate-cashier-names.sql.

SELECT DISTINCT cashier_name, COUNT(*) AS count
FROM public.sales_transactions
GROUP BY cashier_name
ORDER BY count DESC;
