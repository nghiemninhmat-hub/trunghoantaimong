/*
# Create Coupon System for Shop

## Overview
Adds a coupon/discount system. Admins can create coupons with a discount percentage
and usage limit, assign them to specific players by user_id. Players can apply coupons
at checkout to get a percentage discount on their purchase.

## New Tables

### `coupons`
- `id` (uuid, PK)
- `code` (text, unique) — short code for the coupon
- `discount_percent` (int, 1-100) — percentage discount applied
- `max_uses` (int, default 1) — how many times this coupon can be used
- `used_count` (int, default 0) — how many times it has been used so far
- `user_id` (uuid, NOT NULL, REFERENCES profiles) — the player who receives this coupon
- `created_by` (uuid, nullable) — admin who created the coupon
- `note` (text, nullable) — admin note for the coupon
- `is_active` (boolean, default true) — can be toggled to deactivate
- `created_at` (timestamptz, default now())

## Modified Functions

### `purchase_items`
- Added optional parameter `p_coupon_id uuid` (default NULL)
- When a valid coupon is provided, applies `discount_percent` reduction to all currency totals
- Increments `used_count` on the coupon after successful purchase
- Validates coupon belongs to the caller, is active, and has remaining uses

## Security
- RLS enabled on `coupons`
- Admin (is_admin()) can INSERT, UPDATE, DELETE coupons
- Authenticated users can SELECT their own coupons only (auth.uid() = user_id)
*/

CREATE TABLE IF NOT EXISTS coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  discount_percent int NOT NULL CHECK (discount_percent >= 1 AND discount_percent <= 100),
  max_uses int NOT NULL DEFAULT 1 CHECK (max_uses >= 1),
  used_count int NOT NULL DEFAULT 0,
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  created_by uuid,
  note text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;

-- Admin can do everything
DROP POLICY IF EXISTS "coupons_admin_all" ON coupons;
CREATE POLICY "coupons_admin_all" ON coupons
  FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- Users can read their own coupons
DROP POLICY IF EXISTS "coupons_user_select" ON coupons;
CREATE POLICY "coupons_user_select" ON coupons
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

-- Recreate purchase_items with coupon support
CREATE OR REPLACE FUNCTION public.purchase_items(
  p_item_ids uuid[],
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
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_hua_tien int := 0;
  v_cong_duc int := 0;
  v_am_duc int := 0;
  v_profile_hua_tien int;
  v_profile_cong_duc int;
  v_profile_am_duc int;
  v_item record;
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

  -- Sum costs per currency and collect item names
  FOR v_item IN
    SELECT id, name, price, currency_type, price_secondary, currency_type_secondary
    FROM public.shop_items
    WHERE id = ANY(p_item_ids)
  LOOP
    IF v_item.currency_type = 'HUA_TIEN' THEN v_hua_tien := v_hua_tien + v_item.price;
    ELSIF v_item.currency_type = 'CONG_DUC' THEN v_cong_duc := v_cong_duc + v_item.price;
    ELSIF v_item.currency_type = 'AM_DUC' THEN v_am_duc := v_am_duc + v_item.price;
    END IF;

    IF v_item.price_secondary IS NOT NULL AND v_item.currency_type_secondary IS NOT NULL THEN
      IF v_item.currency_type_secondary = 'HUA_TIEN' THEN v_hua_tien := v_hua_tien + v_item.price_secondary;
      ELSIF v_item.currency_type_secondary = 'CONG_DUC' THEN v_cong_duc := v_cong_duc + v_item.price_secondary;
      ELSIF v_item.currency_type_secondary = 'AM_DUC' THEN v_am_duc := v_am_duc + v_item.price_secondary;
      END IF;
    END IF;

    IF v_item_names = '' THEN
      v_item_names := v_item.name;
    ELSE
      v_item_names := v_item_names || ', ' || v_item.name;
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
  INSERT INTO public.inventories (user_id, item_id, quantity)
  SELECT v_uid, id, 1 FROM public.shop_items WHERE id = ANY(p_item_ids)
  ON CONFLICT (user_id, item_id)
  DO UPDATE SET quantity = public.inventories.quantity + 1;

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
$function$;
