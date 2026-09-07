-- Backfill: create missing transaction records for past wheel_spin_log entries
-- that were SHOP items or SPECIAL prizes but never logged in transactions.

INSERT INTO public.transactions (user_id, amount, currency_type, reason, created_at)
SELECT
  wsl.user_id,
  0,
  NULL,
  CASE
    WHEN wsl.is_special THEN 'Quà Đặc Biệt — ' || wsl.reward_label
    ELSE 'Vòng quay may mắn — Vật phẩm: ' || wsl.reward_label
  END,
  wsl.created_at
FROM public.wheel_spin_log wsl
WHERE wsl.reward_group NOT IN ('MISS', 'Hoa Tiền', 'Công Đức', 'Âm Đức')
  AND NOT EXISTS (
    SELECT 1 FROM public.transactions t
    WHERE t.user_id = wsl.user_id
      AND t.created_at = wsl.created_at
      AND t.reason LIKE '%Vòng quay%'
  );
