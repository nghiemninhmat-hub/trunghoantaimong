/*
# Fix transactions CHECK constraint to allow COUPON currency_type

## Problem
The admin dashboard inserts a transaction with `currency_type = 'COUPON'`
when granting coupons to players. However, the transactions table has a
CHECK constraint that only allows `HUA_TIEN`, `CONG_DUC`, `AM_DUC`.
This causes the transaction insert to fail silently.

## Fix
Drop the old CHECK constraint and add a new one that also allows `COUPON`.

## Security
No RLS or policy changes.
*/

ALTER TABLE public.transactions
  DROP CONSTRAINT IF EXISTS transactions_currency_type_check;

ALTER TABLE public.transactions
  ADD CONSTRAINT transactions_currency_type_check
  CHECK (currency_type = ANY (ARRAY['HUA_TIEN'::text, 'CONG_DUC'::text, 'AM_DUC'::text, 'COUPON'::text]));
