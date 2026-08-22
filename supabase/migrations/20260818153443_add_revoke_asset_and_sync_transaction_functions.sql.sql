/*
# Add asset revocation + transaction sync functions

## Purpose
1. `admin_revoke_asset` — Admin can revoke items and/or currency (Hoa Tiền, Công Đức, Âm Đức) from a player, with a required reason. Sends a notification to the affected player and logs a transaction record for currency changes.
2. `admin_edit_transaction` — When admin edits a transaction (amount, currency_type, reason), the player's balance is automatically re-synced: the old amount is reversed and the new amount is applied.
3. `admin_delete_transaction` — When admin deletes a transaction, the player's balance is automatically reversed by the transaction's amount.

## New Functions
- `admin_revoke_asset(p_user_id, p_item_ids[], p_currency_type, p_amount, p_reason)` → jsonb
  - Revokes inventory items by their inventory IDs
  - Deducts currency (negative adjustment) with reason
  - Inserts a notification for the player
  - Returns summary of what was revoked
- `admin_edit_transaction(p_tx_id, p_amount, p_currency_type, p_reason, p_related_user_name)` → jsonb
  - Reverses old transaction effect on balance
  - Applies new transaction effect
  - Updates the transaction row
  - Returns success + new balance
- `admin_delete_transaction(p_tx_id)` → jsonb
  - Reverses transaction effect on balance
  - Deletes the transaction row
  - Returns success

## Security
- All functions are SECURITY DEFINER, search_path = 'public'
- All check is_admin() before executing
- All require authenticated session

## Notes
- Balance is clamped at 0 minimum (cannot go negative)
- Item revocation is optional (can revoke items only, currency only, or both)
- Currency revocation is optional (can pass NULL currency_type to skip)
- All currency changes are logged as transactions with [QTV] prefix
- Notifications are inserted directly into the notifications table
*/
-- =========================================================
-- 1. admin_revoke_asset
-- =========================================================
CREATE OR REPLACE FUNCTION public.admin_revoke_asset(
  p_user_id uuid,
  p_item_ids uuid[] DEFAULT '{}',
  p_currency_type text DEFAULT NULL,
  p_amount integer DEFAULT 0,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_admin_id uuid := auth.uid();
  v_new_balance int;
  v_current int;
  v_final_reason text;
  v_revoked_items text[] := '{}';
  v_item_name text;
  v_item_id uuid;
  v_has_currency_change boolean := false;
  v_notif_body text;
BEGIN
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Bạn phải đăng nhập để thực hiện.';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên mới có quyền thu hồi tài sản.';
  END IF;

  IF p_reason IS NULL OR btrim(p_reason) = '' THEN
    RAISE EXCEPTION 'Lý do thu hồi không được để trống.';
  END IF;

  -- Revoke items
  IF array_length(p_item_ids, 1) > 0 THEN
    FOREACH v_item_id IN ARRAY p_item_ids LOOP
      SELECT si.name INTO v_item_name
      FROM public.inventories inv
      JOIN public.shop_items si ON si.id = inv.item_id
      WHERE inv.id = v_item_id AND inv.user_id = p_user_id;

      IF v_item_name IS NOT NULL THEN
        v_revoked_items := array_append(v_revoked_items, v_item_name);
      END IF;
    END LOOP;

    DELETE FROM public.inventories
    WHERE id = ANY(p_item_ids) AND user_id = p_user_id;
  END IF;

  -- Revoke currency
  IF p_currency_type IS NOT NULL AND p_currency_type IN ('HUA_TIEN', 'CONG_DUC', 'AM_DUC') AND p_amount > 0 THEN
    v_has_currency_change := true;

    SELECT
      CASE p_currency_type
        WHEN 'HUA_TIEN' THEN hua_tien
        WHEN 'CONG_DUC' THEN cong_duc
        WHEN 'AM_DUC' THEN am_duc
      END
    INTO v_current
    FROM public.profiles
    WHERE id = p_user_id;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Không tìm thấy hồ sơ người chơi.';
    END IF;

    v_new_balance := v_current - p_amount;

    IF v_new_balance < 0 THEN
      v_new_balance := 0;
    END IF;

    IF p_currency_type = 'HUA_TIEN' THEN
      UPDATE public.profiles SET hua_tien = v_new_balance WHERE id = p_user_id;
    ELSIF p_currency_type = 'CONG_DUC' THEN
      UPDATE public.profiles SET cong_duc = v_new_balance WHERE id = p_user_id;
    ELSIF p_currency_type = 'AM_DUC' THEN
      UPDATE public.profiles SET am_duc = v_new_balance WHERE id = p_user_id;
    END IF;

    v_final_reason := '[QTV] Thu hồi: ' || btrim(p_reason);

    INSERT INTO public.transactions (user_id, amount, currency_type, reason)
    VALUES (p_user_id, -p_amount, p_currency_type, v_final_reason);
  END IF;

  -- Build notification body
  v_notif_body := '';
  IF array_length(v_revoked_items, 1) > 0 THEN
    v_notif_body := 'Vật phẩm bị thu hồi: ' || array_to_string(v_revoked_items, ', ') || '.';
  END IF;
  IF v_has_currency_change THEN
    IF v_notif_body <> '' THEN
      v_notif_body := v_notif_body || ' ';
    END IF;
    v_notif_body := v_notif_body || 'Tiền tệ bị thu hồi: ' || p_amount || ' ' || 
      CASE p_currency_type 
        WHEN 'HUA_TIEN' THEN 'Hoa Tiền' 
        WHEN 'CONG_DUC' THEN 'Công Đức' 
        WHEN 'AM_DUC' THEN 'Âm Đức' 
      END || '.';
  END IF;
  IF v_notif_body = '' THEN
    v_notif_body := 'Tài sản của bạn đã bị thu hồi.';
  END IF;
  v_notif_body := v_notif_body || ' Lý do: ' || p_reason;

  -- Send notification to player
  INSERT INTO public.notifications (recipient_id, type, title, body)
  VALUES (p_user_id, 'asset_revoked', 'Tài sản bị thu hồi', v_notif_body);

  RETURN jsonb_build_object(
    'success', true,
    'revoked_items', v_revoked_items,
    'currency_revoked', v_has_currency_change,
    'new_balance', v_new_balance
  );
END;
$function$;

-- =========================================================
-- 2. admin_edit_transaction
-- =========================================================
CREATE OR REPLACE FUNCTION public.admin_edit_transaction(
  p_tx_id uuid,
  p_amount integer DEFAULT NULL,
  p_currency_type text DEFAULT NULL,
  p_reason text DEFAULT NULL,
  p_related_user_name text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_admin_id uuid := auth.uid();
  v_tx public.transactions%ROWTYPE;
  v_old_amount int;
  v_old_currency text;
  v_new_amount int;
  v_new_currency text;
  v_current int;
  v_new_balance int;
  v_col text;
BEGIN
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Bạn phải đăng nhập để thực hiện.';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên mới có quyền sửa giao dịch.';
  END IF;

  SELECT * INTO v_tx FROM public.transactions WHERE id = p_tx_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy giao dịch.';
  END IF;

  v_old_amount := v_tx.amount;
  v_old_currency := v_tx.currency_type;
  v_new_amount := COALESCE(p_amount, v_tx.amount);
  v_new_currency := COALESCE(p_currency_type, v_tx.currency_type);

  -- Reverse old amount from balance
  IF v_old_currency = 'HUA_TIEN' THEN
    v_col := 'hua_tien';
  ELSIF v_old_currency = 'CONG_DUC' THEN
    v_col := 'cong_duc';
  ELSIF v_old_currency = 'AM_DUC' THEN
    v_col := 'am_duc';
  END IF;

  EXECUTE format('SELECT %I FROM public.profiles WHERE id = $1', v_col)
    INTO v_current USING v_tx.user_id;

  v_new_balance := v_current - v_old_amount;
  IF v_new_balance < 0 THEN v_new_balance := 0; END IF;

  EXECUTE format('UPDATE public.profiles SET %I = $1 WHERE id = $2', v_col)
    USING v_new_balance, v_tx.user_id;

  -- Apply new amount to balance
  IF v_new_currency = 'HUA_TIEN' THEN
    v_col := 'hua_tien';
  ELSIF v_new_currency = 'CONG_DUC' THEN
    v_col := 'cong_duc';
  ELSIF v_new_currency = 'AM_DUC' THEN
    v_col := 'am_duc';
  END IF;

  EXECUTE format('SELECT %I FROM public.profiles WHERE id = $1', v_col)
    INTO v_current USING v_tx.user_id;

  v_new_balance := v_current + v_new_amount;
  IF v_new_balance < 0 THEN v_new_balance := 0; END IF;

  EXECUTE format('UPDATE public.profiles SET %I = $1 WHERE id = $2', v_col)
    USING v_new_balance, v_tx.user_id;

  -- Update the transaction row
  UPDATE public.transactions SET
    amount = v_new_amount,
    currency_type = v_new_currency,
    reason = COALESCE(p_reason, v_tx.reason),
    related_user_name = COALESCE(p_related_user_name, v_tx.related_user_name)
  WHERE id = p_tx_id;

  RETURN jsonb_build_object(
    'success', true,
    'new_balance', v_new_balance,
    'currency_type', v_new_currency
  );
END;
$function$;

-- =========================================================
-- 3. admin_delete_transaction
-- =========================================================
CREATE OR REPLACE FUNCTION public.admin_delete_transaction(
  p_tx_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_admin_id uuid := auth.uid();
  v_tx public.transactions%ROWTYPE;
  v_current int;
  v_new_balance int;
  v_col text;
BEGIN
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Bạn phải đăng nhập để thực hiện.';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên mới có quyền xóa giao dịch.';
  END IF;

  SELECT * INTO v_tx FROM public.transactions WHERE id = p_tx_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy giao dịch.';
  END IF;

  -- Reverse the transaction's effect on balance
  IF v_tx.currency_type = 'HUA_TIEN' THEN
    v_col := 'hua_tien';
  ELSIF v_tx.currency_type = 'CONG_DUC' THEN
    v_col := 'cong_duc';
  ELSIF v_tx.currency_type = 'AM_DUC' THEN
    v_col := 'am_duc';
  END IF;

  EXECUTE format('SELECT %I FROM public.profiles WHERE id = $1', v_col)
    INTO v_current USING v_tx.user_id;

  v_new_balance := v_current - v_tx.amount;
  IF v_new_balance < 0 THEN v_new_balance := 0; END IF;

  EXECUTE format('UPDATE public.profiles SET %I = $1 WHERE id = $2', v_col)
    USING v_new_balance, v_tx.user_id;

  -- Delete the transaction
  DELETE FROM public.transactions WHERE id = p_tx_id;

  RETURN jsonb_build_object(
    'success', true,
    'reversed_amount', v_tx.amount,
    'currency_type', v_tx.currency_type,
    'new_balance', v_new_balance
  );
END;
$function$;
