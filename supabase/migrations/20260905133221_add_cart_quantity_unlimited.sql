/*
# Add quantity column to carts and update purchase_items for unlimited cart

1. Changes to `carts` table
- Add `quantity` column (int, not null, default 1) to carts table.
- Merge existing duplicate (user_id, item_id) rows by summing quantities.
- Add a unique constraint on (user_id, item_id) so duplicate adds increment quantity.

2. Changes to `purchase_items` function
- Accepts `p_item_ids uuid[]` and `p_quantities int[]` in parallel arrays.
- Sums cost as price * quantity for each item.
- Inserts quantity rows into inventories per item.
- Clears cart rows for purchased items.
- Backward compatible: if p_quantities is NULL, defaults to 1 per item.

3. Security
- No RLS policy changes — carts already have owner-scoped CRUD policies.
- purchase_items remains SECURITY DEFINER, EXECUTE granted to authenticated only.
*/

-- Add quantity column to carts
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'carts' AND column_name = 'quantity'
  ) THEN
    ALTER TABLE public.carts ADD COLUMN quantity int NOT NULL DEFAULT 1;
  END IF;
END $$;

-- Merge duplicate rows: keep one row per (user_id, item_id) with summed quantity
DELETE FROM public.carts
WHERE id NOT IN (
  SELECT (array_agg(id ORDER BY created_at))[1] FROM public.carts
  GROUP BY user_id, item_id
);
-- Update the kept rows to have the summed quantity
UPDATE public.carts c
SET quantity = sub.total_qty
FROM (
  SELECT user_id, item_id, SUM(quantity) AS total_qty
  FROM public.carts
  GROUP BY user_id, item_id
) sub
WHERE c.user_id = sub.user_id AND c.item_id = sub.item_id;

-- Add unique constraint so each user has one row per item
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'carts_user_item_unique' AND table_name = 'carts'
  ) THEN
    ALTER TABLE public.carts ADD CONSTRAINT carts_user_item_unique UNIQUE (user_id, item_id);
  END IF;
END $$;

-- Drop old purchase_items function
DROP FUNCTION IF EXISTS public.purchase_items(uuid[]);

-- Create new purchase_items function with quantity support
CREATE FUNCTION public.purchase_items(
  p_item_ids uuid[],
  p_quantities int[] DEFAULT NULL
)
RETURNS TABLE (
  item_count int,
  total_hua_tien int,
  total_cong_duc int,
  total_am_duc int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_hua_tien int := 0;
  v_cong_duc int := 0;
  v_am_duc int := 0;
  v_profile_hua_tien int;
  v_profile_cong_duc int;
  v_profile_am_duc int;
  v_item record;
  v_qty int;
  v_idx int;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_item_ids IS NULL OR array_length(p_item_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Không có vật phẩm để mua';
  END IF;

  -- Sum costs per currency, multiplying by quantity
  FOR v_idx IN 1..array_length(p_item_ids, 1) LOOP
    v_qty := COALESCE(p_quantities[v_idx], 1);
    IF v_qty < 1 THEN
      v_qty := 1;
    END IF;

    SELECT price, currency_type, price_secondary, currency_type_secondary
      INTO v_item
      FROM public.shop_items
      WHERE id = p_item_ids[v_idx];

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Vật phẩm không tồn tại';
    END IF;

    IF v_item.currency_type = 'HUA_TIEN' THEN v_hua_tien := v_hua_tien + v_item.price * v_qty;
    ELSIF v_item.currency_type = 'CONG_DUC' THEN v_cong_duc := v_cong_duc + v_item.price * v_qty;
    ELSIF v_item.currency_type = 'AM_DUC' THEN v_am_duc := v_am_duc + v_item.price * v_qty;
    END IF;

    IF v_item.price_secondary IS NOT NULL AND v_item.currency_type_secondary IS NOT NULL THEN
      IF v_item.currency_type_secondary = 'HUA_TIEN' THEN v_hua_tien := v_hua_tien + v_item.price_secondary * v_qty;
      ELSIF v_item.currency_type_secondary = 'CONG_DUC' THEN v_cong_duc := v_cong_duc + v_item.price_secondary * v_qty;
      ELSIF v_item.currency_type_secondary = 'AM_DUC' THEN v_am_duc := v_am_duc + v_item.price_secondary * v_qty;
      END IF;
    END IF;
  END LOOP;

  -- Check balance
  SELECT hua_tien, cong_duc, am_duc INTO v_profile_hua_tien, v_profile_cong_duc, v_profile_am_duc
    FROM public.profiles WHERE id = v_uid;

  IF v_profile_hua_tien IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy hồ sơ người chơi';
  END IF;

  IF v_hua_tien > v_profile_hua_tien OR v_cong_duc > v_profile_cong_duc OR v_am_duc > v_profile_am_duc THEN
    RAISE EXCEPTION 'Không đủ tài sản để thanh toán';
  END IF;

  -- Deduct currency
  UPDATE public.profiles
    SET hua_tien = hua_tien - v_hua_tien,
        cong_duc = cong_duc - v_cong_duc,
        am_duc = am_duc - v_am_duc
    WHERE id = v_uid;

  -- Add items to inventory (one row per unit)
  FOR v_idx IN 1..array_length(p_item_ids, 1) LOOP
    v_qty := COALESCE(p_quantities[v_idx], 1);
    IF v_qty < 1 THEN
      v_qty := 1;
    END IF;

    INSERT INTO public.inventories (user_id, item_id)
      SELECT v_uid, p_item_ids[v_idx] FROM generate_series(1, v_qty);
  END LOOP;

  -- Log transactions
  IF v_hua_tien > 0 THEN
    INSERT INTO public.transactions (user_id, amount, currency_type, reason)
      VALUES (v_uid, -v_hua_tien, 'HUA_TIEN', 'Mua sắm thương thành');
  END IF;
  IF v_cong_duc > 0 THEN
    INSERT INTO public.transactions (user_id, amount, currency_type, reason)
      VALUES (v_uid, -v_cong_duc, 'CONG_DUC', 'Mua sắm thương thành');
  END IF;
  IF v_am_duc > 0 THEN
    INSERT INTO public.transactions (user_id, amount, currency_type, reason)
      VALUES (v_uid, -v_am_duc, 'AM_DUC', 'Mua sắm thương thành');
  END IF;

  -- Clear purchased items from cart
  DELETE FROM public.carts
    WHERE user_id = v_uid AND item_id = ANY(p_item_ids);

  RETURN QUERY
    SELECT
      array_length(p_item_ids, 1),
      v_hua_tien,
      v_cong_duc,
      v_am_duc;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.purchase_items(uuid[], int[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.purchase_items(uuid[], int[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purchase_items(uuid[], int[]) TO authenticated;
