/*
# Fix purchase_items to support quantity + coupon together

1. What happened
- Previous migration (add_cart_quantity_unlimited) dropped the old purchase_items(uuid[]) and recreated it with (uuid[], int[]) but lost the coupon support that was added in the coupon system migration.
- This migration recreates purchase_items with all three parameters: p_item_ids, p_quantities, and p_coupon_id.

2. What the function does
- Accepts item IDs, quantities (parallel array), and optional coupon ID.
- Sums cost as price * quantity per item.
- Applies coupon discount if provided.
- Checks balance, deducts currency, inserts items into inventory (stacking via ON CONFLICT).
- Logs transactions with item names and discount info.
- Increments coupon usage if applied.
- Clears cart rows for purchased items.

3. Security
- SECURITY DEFINER, EXECUTE granted to authenticated only.
*/

DROP FUNCTION IF EXISTS public.purchase_items(uuid[], int[]);
DROP FUNCTION IF EXISTS public.purchase_items(uuid[], uuid);
DROP FUNCTION IF EXISTS public.purchase_items(uuid[]);

CREATE FUNCTION public.purchase_items(
  p_item_ids uuid[],
  p_quantities int[] DEFAULT NULL,
  p_coupon_id uuid DEFAULT NULL
)
RETURNS TABLE(
  item_count integer,
  total_hua_tien integer,
  total_cong_duc integer,
  total_am_duc integer,
  discount_percent integer,
  discounted_hua_tien integer,
  discounted_cong_duc integer,
  discounted_am_duc integer
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
  v_item_names text := '';
  v_reason_hua text;
  v_reason_con text;
  v_reason_am text;
  v_discount int := 0;
  v_disc_hua int := 0;
  v_disc_con int := 0;
  v_disc_am int := 0;
  v_final_hua int := 0;
  v_final_con int := 0;
  v_final_am int := 0;
  v_coupon record;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_item_ids IS NULL OR array_length(p_item_ids, 1) IS NULL THEN
    RAISE EXCEPTION 'Không có vật phẩm để mua';
  END IF;

  -- Sum costs per currency, multiplying by quantity, collect item names
  FOR v_idx IN 1..array_length(p_item_ids, 1) LOOP
    v_qty := COALESCE(p_quantities[v_idx], 1);
    IF v_qty < 1 THEN
      v_qty := 1;
    END IF;

    SELECT id, name, price, currency_type, price_secondary, currency_type_secondary
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

    IF v_item_names = '' THEN
      v_item_names := v_item.name;
      IF v_qty > 1 THEN
        v_item_names := v_item_names || ' ×' || v_qty;
      END IF;
    ELSE
      v_item_names := v_item_names || ', ' || v_item.name;
      IF v_qty > 1 THEN
        v_item_names := v_item_names || ' ×' || v_qty;
      END IF;
    END IF;
  END LOOP;

  -- Validate and apply coupon
  IF p_coupon_id IS NOT NULL THEN
    SELECT discount_percent, used_count, max_uses, is_active, user_id
    INTO v_coupon
    FROM public.coupons
    WHERE id = p_coupon_id
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Phiếu giảm giá không tồn tại';
    END IF;

    IF v_coupon.user_id != v_uid THEN
      RAISE EXCEPTION 'Phiếu giảm giá không thuộc về bạn';
    END IF;

    IF v_coupon.is_active = false THEN
      RAISE EXCEPTION 'Phiếu giảm giá đã bị vô hiệu hóa';
    END IF;

    IF v_coupon.used_count >= v_coupon.max_uses THEN
      RAISE EXCEPTION 'Phiếu giảm giá đã hết lượt sử dụng';
    END IF;

    v_discount := v_coupon.discount_percent;
    v_disc_hua := CEIL(v_hua_tien * v_discount / 100.0);
    v_disc_con := CEIL(v_cong_duc * v_discount / 100.0);
    v_disc_am := CEIL(v_am_duc * v_discount / 100.0);
    v_final_hua := v_hua_tien - v_disc_hua;
    v_final_con := v_cong_duc - v_disc_con;
    v_final_am := v_am_duc - v_disc_am;
  ELSE
    v_final_hua := v_hua_tien;
    v_final_con := v_cong_duc;
    v_final_am := v_am_duc;
  END IF;

  -- Check balance
  SELECT hua_tien, cong_duc, am_duc INTO v_profile_hua_tien, v_profile_cong_duc, v_profile_am_duc
  FROM public.profiles WHERE id = v_uid;

  IF v_profile_hua_tien IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy hồ sơ người chơi';
  END IF;

  IF v_final_hua > v_profile_hua_tien OR v_final_con > v_profile_cong_duc OR v_final_am > v_profile_am_duc THEN
    RAISE EXCEPTION 'Không đủ tài sản để thanh toán';
  END IF;

  -- Deduct currency (discounted amounts)
  UPDATE public.profiles
  SET hua_tien = hua_tien - v_final_hua,
      cong_duc = cong_duc - v_final_con,
      am_duc = am_duc - v_final_am
  WHERE id = v_uid;

  -- Add items to inventory (stack if already owned)
  FOR v_idx IN 1..array_length(p_item_ids, 1) LOOP
    v_qty := COALESCE(p_quantities[v_idx], 1);
    IF v_qty < 1 THEN
      v_qty := 1;
    END IF;

    INSERT INTO public.inventories (user_id, item_id, quantity)
    VALUES (v_uid, p_item_ids[v_idx], v_qty)
    ON CONFLICT (user_id, item_id)
    DO UPDATE SET quantity = public.inventories.quantity + EXCLUDED.quantity;
  END LOOP;

  -- Log transactions
  IF v_final_hua > 0 THEN
    v_reason_hua := 'Mua sắm: ' || v_item_names || ' — ' || v_final_hua || ' Hoa Tiền'
      || CASE WHEN v_discount > 0 THEN ' (giảm ' || v_discount || '%)' ELSE '' END;
    INSERT INTO public.transactions (user_id, amount, currency_type, reason)
    VALUES (v_uid, -v_final_hua, 'HUA_TIEN', v_reason_hua);
  END IF;
  IF v_final_con > 0 THEN
    v_reason_con := 'Mua sắm: ' || v_item_names || ' — ' || v_final_con || ' Công Đức'
      || CASE WHEN v_discount > 0 THEN ' (giảm ' || v_discount || '%)' ELSE '' END;
    INSERT INTO public.transactions (user_id, amount, currency_type, reason)
    VALUES (v_uid, -v_final_con, 'CONG_DUC', v_reason_con);
  END IF;
  IF v_final_am > 0 THEN
    v_reason_am := 'Mua sắm: ' || v_item_names || ' — ' || v_final_am || ' Âm Đức'
      || CASE WHEN v_discount > 0 THEN ' (giảm ' || v_discount || '%)' ELSE '' END;
    INSERT INTO public.transactions (user_id, amount, currency_type, reason)
    VALUES (v_uid, -v_final_am, 'AM_DUC', v_reason_am);
  END IF;

  -- Increment coupon usage
  IF p_coupon_id IS NOT NULL THEN
    UPDATE public.coupons
    SET used_count = used_count + 1
    WHERE id = p_coupon_id;
  END IF;

  -- Clear purchased items from cart
  DELETE FROM public.carts
  WHERE user_id = v_uid AND item_id = ANY(p_item_ids);

  RETURN QUERY
  SELECT
    array_length(p_item_ids, 1),
    v_hua_tien,
    v_cong_duc,
    v_am_duc,
    v_discount,
    v_final_hua,
    v_final_con,
    v_final_am;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.purchase_items(uuid[], int[], uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.purchase_items(uuid[], int[], uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purchase_items(uuid[], int[], uuid) TO authenticated;
