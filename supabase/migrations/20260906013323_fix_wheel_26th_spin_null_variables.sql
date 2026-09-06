/*
# Fix wheel 26th spin bug — NULL reward variables when special stock unavailable

## Problem
When a player reaches their threshold (default 26) for the guaranteed
special reward, `spin_wheel()` runs a `SELECT INTO` on
`wheel_reward_stock` to find an available special item. That SELECT
overwrites `v_reward_key` and `v_reward_label` — variables that were
already set by the random-roll logic. If the SELECT finds no rows
(all special stock exhausted), PL/pgSQL sets the target variables to
NULL. The subsequent `INSERT INTO wheel_spin_log` then fails because
`reward_key` and `reward_label` are NOT NULL columns. The entire
transaction rolls back, leaving `wheel_total_spins` at 25 and the
player permanently stuck.

## Fix
1. Use separate local variables (`v_special_stock_id`,
   `v_special_label`, `v_special_key`) for the special-stock SELECT
   so the original reward variables are never overwritten when no
   rows are found.
2. Only overwrite the reward variables when a special item is
   actually found.
3. If no special stock is available, the player still gets their
   normal random-roll reward (the spin is not wasted).
4. Drop the temporary `test_spin_wheel` debug function.

## Security
- No table, RLS, or policy changes.
- Function remains SECURITY DEFINER, search_path = public.
- EXECUTE grants unchanged (authenticated only).
*/

CREATE OR REPLACE FUNCTION public.spin_wheel()
RETURNS TABLE (
  reward_key text,
  reward_label text,
  reward_group text,
  is_special boolean,
  currency_type text,
  amount int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_spins int;
  v_total_spins int;
  v_special_claimed boolean;
  v_threshold int;
  v_roll float;
  v_group text;
  v_sub_roll float;
  v_reward_key text;
  v_reward_label text;
  v_reward_group text;
  v_is_special boolean := false;
  v_currency text;
  v_amount int := 0;
  v_stock_id uuid;
  v_oc_name text;
  v_special_stock_id uuid;
  v_special_label text;
  v_special_key text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.profiles
    SET wheel_spins = wheel_spins - 1,
        wheel_total_spins = wheel_total_spins + 1
    WHERE id = v_uid AND wheel_spins > 0
    RETURNING wheel_spins, wheel_total_spins, wheel_special_claimed, wheel_special_threshold, oc_name
    INTO v_spins, v_total_spins, v_special_claimed, v_threshold, v_oc_name;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Bạn không có lượt quay nào';
  END IF;

  v_roll := random();
  IF v_roll < 0.30 THEN
    v_group := 'MISS';
  ELSIF v_roll < 0.50 THEN
    v_group := 'HUA_TIEN';
  ELSIF v_roll < 0.78 THEN
    v_group := 'CONG_DUC';
  ELSIF v_roll < 0.85 THEN
    v_group := 'AM_DUC';
  ELSE
    v_group := 'SHOP';
  END IF;

  IF v_group = 'SHOP' THEN
    PERFORM 1 FROM public.wheel_reward_stock
      WHERE group_name = 'SHOP' AND claimed < quantity
      LIMIT 1;
    IF NOT FOUND THEN
      v_group := 'MISS';
    END IF;
  END IF;

  v_sub_roll := random();

  IF v_group = 'MISS' THEN
    v_reward_key := 'MISS';
    v_reward_label := 'Chúc bạn may mắn lần sau';
    v_reward_group := 'MISS';

  ELSIF v_group = 'HUA_TIEN' THEN
    v_currency := 'HUA_TIEN';
    IF v_sub_roll < 0.7042 THEN
      v_amount := 50;
    ELSIF v_sub_roll < 0.9859 THEN
      v_amount := 100;
    ELSE
      v_amount := 500;
    END IF;
    v_reward_key := 'HUA_TIEN_' || v_amount;
    v_reward_label := v_amount || ' Hoa Tiền';
    v_reward_group := 'Hoa Tiền';

  ELSIF v_group = 'CONG_DUC' THEN
    v_currency := 'CONG_DUC';
    IF v_sub_roll < 0.6757 THEN
      v_amount := 5;
    ELSIF v_sub_roll < 0.9460 THEN
      v_amount := 10;
    ELSE
      v_amount := 100;
    END IF;
    v_reward_key := 'CONG_DUC_' || v_amount;
    v_reward_label := v_amount || ' Công Đức';
    v_reward_group := 'Công Đức';

  ELSIF v_group = 'AM_DUC' THEN
    v_currency := 'AM_DUC';
    IF v_sub_roll < 0.6667 THEN
      v_amount := 5;
    ELSE
      v_amount := 50;
    END IF;
    v_reward_key := 'AM_DUC_' || v_amount;
    v_reward_label := v_amount || ' Âm Đức';
    v_reward_group := 'Âm Đức';

  ELSIF v_group = 'SHOP' THEN
    IF v_sub_roll < 0.50 THEN
      v_reward_key := 'SHOP_KV1';
    ELSIF v_sub_roll < 0.8571 THEN
      v_reward_key := 'SHOP_KV2';
    ELSE
      v_reward_key := 'SHOP_KV3';
    END IF;
    SELECT id, label INTO v_stock_id, v_reward_label
      FROM public.wheel_reward_stock
      WHERE reward_key = v_reward_key AND claimed < quantity
      LIMIT 1;
    IF v_stock_id IS NULL THEN
      SELECT id, label, reward_key INTO v_stock_id, v_reward_label, v_reward_key
        FROM public.wheel_reward_stock
        WHERE group_name = 'SHOP' AND claimed < quantity
        ORDER BY random()
        LIMIT 1;
    END IF;
    IF v_stock_id IS NULL THEN
      v_group := 'MISS';
      v_reward_key := 'MISS';
      v_reward_label := 'Chúc bạn may mắn lần sau';
      v_reward_group := 'MISS';
    ELSE
      v_reward_group := 'Vật phẩm Thương Thành';
    END IF;
  END IF;

  -- Guaranteed special when total spins reach this account's threshold, once per account
  -- Uses separate variables so the normal reward is preserved if no special stock is available
  IF v_total_spins >= v_threshold AND NOT v_special_claimed THEN
    SELECT id, label, reward_key INTO v_special_stock_id, v_special_label, v_special_key
      FROM public.wheel_reward_stock
      WHERE is_special = true AND claimed < quantity
      ORDER BY random()
      LIMIT 1;
    IF v_special_stock_id IS NOT NULL THEN
      v_stock_id := v_special_stock_id;
      v_reward_key := v_special_key;
      v_reward_label := v_special_label;
      v_group := 'SPECIAL';
      v_is_special := true;
      v_reward_group := 'Quà Đặc Biệt';
      v_currency := NULL;
      v_amount := 0;
      UPDATE public.profiles SET wheel_special_claimed = true WHERE id = v_uid;
    END IF;
  END IF;

  -- Apply rewards
  IF v_group = 'HUA_TIEN' OR v_group = 'CONG_DUC' OR v_group = 'AM_DUC' THEN
    IF v_currency = 'HUA_TIEN' THEN
      UPDATE public.profiles SET hua_tien = hua_tien + v_amount WHERE id = v_uid;
    ELSIF v_currency = 'CONG_DUC' THEN
      UPDATE public.profiles SET cong_duc = cong_duc + v_amount WHERE id = v_uid;
    ELSIF v_currency = 'AM_DUC' THEN
      UPDATE public.profiles SET am_duc = am_duc + v_amount WHERE id = v_uid;
    END IF;
    INSERT INTO public.transactions (user_id, amount, currency_type, reason)
      VALUES (v_uid, v_amount, v_currency, 'Vòng quay may mắn');
  END IF;

  -- Decrement stock for shop / special
  IF v_stock_id IS NOT NULL AND (v_group = 'SHOP' OR v_group = 'SPECIAL') THEN
    UPDATE public.wheel_reward_stock
      SET claimed = claimed + 1
      WHERE id = v_stock_id;
  END IF;

  -- Log the spin
  INSERT INTO public.wheel_spin_log (user_id, oc_name, reward_key, reward_label, reward_group, is_special)
    VALUES (v_uid, v_oc_name, v_reward_key, v_reward_label, v_reward_group, v_is_special);

  RETURN QUERY
    SELECT v_reward_key, v_reward_label, v_reward_group, v_is_special, v_currency, v_amount;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.spin_wheel() FROM anon;
REVOKE EXECUTE ON FUNCTION public.spin_wheel() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.spin_wheel() TO authenticated;

DROP FUNCTION IF EXISTS public.test_spin_wheel(uuid);
