/*
# Stack inventory items by quantity

When a player buys the same shop item multiple times, instead of creating
duplicate rows in inventories, we stack them into a single row with a
quantity column. Buying 3 of "Giấy Vàng Khai Quang" = 1 row with quantity 3.
*/

-- 1. Add quantity column
ALTER TABLE public.inventories
  ADD COLUMN IF NOT EXISTS quantity int NOT NULL DEFAULT 1;

-- 2. Backfill: merge duplicates
-- For each (user_id, item_id) group with multiple rows, sum quantities
-- into the oldest row and delete the surplus rows.
WITH dup_groups AS (
  SELECT user_id, item_id
  FROM public.inventories
  GROUP BY user_id, item_id
  HAVING count(*) > 1
),
keep_rows AS (
  SELECT DISTINCT ON (user_id, item_id) id, user_id, item_id
  FROM public.inventories
  ORDER BY user_id, item_id, acquired_at ASC
),
totals AS (
  SELECT i.user_id, i.item_id, sum(i.quantity) AS total_qty
  FROM public.inventories i
  JOIN dup_groups d ON d.user_id = i.user_id AND d.item_id = i.item_id
  GROUP BY i.user_id, i.item_id
)
UPDATE public.inventories k
SET quantity = t.total_qty
FROM keep_rows ki
JOIN totals t ON t.user_id = ki.user_id AND t.item_id = ki.item_id
WHERE k.id = ki.id;

-- Delete surplus rows (all rows that are NOT the keep row, for duplicate groups)
DELETE FROM public.inventories
WHERE id NOT IN (
  SELECT id FROM (
    SELECT DISTINCT ON (user_id, item_id) id
    FROM public.inventories
    ORDER BY user_id, item_id, acquired_at ASC
  ) sub
)
AND (user_id, item_id) IN (
  SELECT user_id, item_id
  FROM public.inventories
  GROUP BY user_id, item_id
  HAVING count(*) > 1
);

-- 3. Add unique constraint
CREATE UNIQUE INDEX IF NOT EXISTS idx_inventories_user_item_unique
  ON public.inventories (user_id, item_id);

-- 4. Rewrite purchase_items to stack on conflict
CREATE OR REPLACE FUNCTION public.purchase_items(p_item_ids uuid[])
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
  v_item_names text := '';
  v_reason_hua text;
  v_reason_con text;
  v_reason_am text;
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

  -- Add items to inventory (stack if already owned)
  INSERT INTO public.inventories (user_id, item_id, quantity)
    SELECT v_uid, id, 1 FROM public.shop_items WHERE id = ANY(p_item_ids)
  ON CONFLICT (user_id, item_id)
    DO UPDATE SET quantity = public.inventories.quantity + 1;

  -- Log transactions with item names in the reason
  IF v_hua_tien > 0 THEN
    v_reason_hua := 'Mua sắm: ' || v_item_names || ' — ' || v_hua_tien || ' Hoa Tiền';
    INSERT INTO public.transactions (user_id, amount, currency_type, reason)
      VALUES (v_uid, -v_hua_tien, 'HUA_TIEN', v_reason_hua);
  END IF;
  IF v_cong_duc > 0 THEN
    v_reason_con := 'Mua sắm: ' || v_item_names || ' — ' || v_cong_duc || ' Công Đức';
    INSERT INTO public.transactions (user_id, amount, currency_type, reason)
      VALUES (v_uid, -v_cong_duc, 'CONG_DUC', v_reason_con);
  END IF;
  IF v_am_duc > 0 THEN
    v_reason_am := 'Mua sắm: ' || v_item_names || ' — ' || v_am_duc || ' Âm Đức';
    INSERT INTO public.transactions (user_id, amount, currency_type, reason)
      VALUES (v_uid, -v_am_duc, 'AM_DUC', v_reason_am);
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

REVOKE EXECUTE ON FUNCTION public.purchase_items(uuid[]) FROM anon;
REVOKE EXECUTE ON FUNCTION public.purchase_items(uuid[]) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purchase_items(uuid[]) TO authenticated;

-- 5. Rewrite admin_grant_inventory_item to stack on conflict
CREATE OR REPLACE FUNCTION public.admin_grant_inventory_item(
  p_user_id uuid,
  p_item_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_admin_id uuid := auth.uid();
  v_item_name text;
BEGIN
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Bạn phải đăng nhập để thực hiện.';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên mới có quyền tặng vật phẩm.';
  END IF;

  SELECT name INTO v_item_name FROM public.shop_items WHERE id = p_item_id;
  IF v_item_name IS NULL THEN
    RAISE EXCEPTION 'Vật phẩm không tồn tại.';
  END IF;

  -- Insert or stack quantity
  INSERT INTO public.inventories (user_id, item_id, quantity)
    VALUES (p_user_id, p_item_id, 1)
  ON CONFLICT (user_id, item_id)
    DO UPDATE SET quantity = public.inventories.quantity + 1;

  -- Log a transaction (amount=0, purely audit)
  INSERT INTO public.transactions (user_id, amount, currency_type, reason)
    VALUES (p_user_id, 0, 'HUA_TIEN', '[QTV] Tặng vật phẩm: ' || v_item_name);

  -- Notify the player
  INSERT INTO public.notifications (recipient_id, type, title, body)
    VALUES (
      p_user_id,
      'item_granted',
      'Nhận vật phẩm',
      'Bạn đã nhận được vật phẩm "' || v_item_name || '" từ quản trị viên.'
    );

  RETURN jsonb_build_object('success', true, 'item_name', v_item_name);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.admin_grant_inventory_item(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_grant_inventory_item(uuid, uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_grant_inventory_item(uuid, uuid) TO authenticated;

-- 6. Rewrite admin_revoke_inventory_item to decrement quantity
CREATE OR REPLACE FUNCTION public.admin_revoke_inventory_item(
  p_inv_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_admin_id uuid := auth.uid();
  v_inv record;
  v_item_name text;
  v_final_reason text;
  v_current_qty int;
BEGIN
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Bạn phải đăng nhập để thực hiện.';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên mới có quyền thu hồi vật phẩm.';
  END IF;

  SELECT inv.user_id, inv.item_id, inv.quantity, si.name
  INTO v_inv
  FROM public.inventories inv
  JOIN public.shop_items si ON si.id = inv.item_id
  WHERE inv.id = p_inv_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy vật phẩm trong kho.';
  END IF;

  v_item_name := v_inv.name;
  v_current_qty := v_inv.quantity;

  -- Decrement quantity, or delete if only 1 left
  IF v_current_qty > 1 THEN
    UPDATE public.inventories SET quantity = quantity - 1 WHERE id = p_inv_id;
  ELSE
    DELETE FROM public.inventories WHERE id = p_inv_id;
  END IF;

  -- Log a transaction record (amount=0, purely audit — no currency change)
  v_final_reason := '[QTV] Thu hồi vật phẩm: ' || v_item_name;
  IF p_reason IS NOT NULL AND btrim(p_reason) <> '' THEN
    v_final_reason := v_final_reason || ' — ' || btrim(p_reason);
  END IF;

  INSERT INTO public.transactions (user_id, amount, currency_type, reason)
    VALUES (v_inv.user_id, 0, 'HUA_TIEN', v_final_reason);

  -- Notify the player
  INSERT INTO public.notifications (recipient_id, type, title, body)
    VALUES (
      v_inv.user_id,
      'asset_revoked',
      'Vật phẩm bị thu hồi',
      'Vật phẩm "' || v_item_name || '" đã bị quản trị viên thu hồi.' ||
      CASE WHEN p_reason IS NOT NULL AND btrim(p_reason) <> '' THEN ' Lý do: ' || btrim(p_reason) ELSE '' END
    );

  RETURN jsonb_build_object(
    'success', true,
    'item_name', v_item_name,
    'user_id', v_inv.user_id,
    'remaining_quantity', GREATEST(v_current_qty - 1, 0)
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.admin_revoke_inventory_item(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_revoke_inventory_item(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_revoke_inventory_item(uuid, text) TO authenticated;
