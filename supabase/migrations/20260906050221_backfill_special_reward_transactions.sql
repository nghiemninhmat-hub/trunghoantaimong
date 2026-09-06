/*
# Backfill special reward transactions for existing winners

Two players (Hành Lâm and Tựu Đan Lạc) won special rewards before the
migration that adds transaction records for special rewards. This
backfills their transaction history so the rewards appear in
"Lịch Sử Giao Dịch" like all other rewards.

Uses the timestamp from wheel_spin_log so the transaction appears at
the correct time.
*/

INSERT INTO public.transactions (user_id, amount, currency_type, reason, created_at)
SELECT 
  user_id,
  0,
  NULL,
  'Quà Đặc Biệt: ' || reward_label,
  created_at
FROM public.wheel_spin_log
WHERE is_special = true
  AND user_id IN (
    'cb967c2b-1c27-454e-91bf-5c7ff679504f',
    'e0549080-7c55-4488-a940-115c0ef3c5d9'
  )
  AND NOT EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.user_id = wheel_spin_log.user_id
      AND t.reason = 'Quà Đặc Biệt: ' || wheel_spin_log.reward_label
      AND t.created_at = wheel_spin_log.created_at
  );
