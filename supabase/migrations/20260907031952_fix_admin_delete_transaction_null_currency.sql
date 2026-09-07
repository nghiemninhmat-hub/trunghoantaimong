-- Fix: admin_delete_transaction now handles transactions with NULL currency_type
-- (e.g. SHOP item rewards and SPECIAL prizes from the wheel). Previously
-- it would crash because v_col was NULL and EXECUTE format('SELECT %I ...', NULL) fails.

CREATE OR REPLACE FUNCTION public.admin_delete_transaction(p_tx_id uuid)
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

  -- Reverse the transaction's effect on balance (only for currency rewards)
  IF v_tx.currency_type = 'HUA_TIEN' THEN
    v_col := 'hua_tien';
  ELSIF v_tx.currency_type = 'CONG_DUC' THEN
    v_col := 'cong_duc';
  ELSIF v_tx.currency_type = 'AM_DUC' THEN
    v_col := 'am_duc';
  ELSE
    -- NULL currency_type or non-currency transactions (items, special prizes)
    -- Nothing to reverse — just delete the record
    v_col := NULL;
  END IF;

  IF v_col IS NOT NULL THEN
    EXECUTE format('SELECT %I FROM public.profiles WHERE id = $1', v_col)
    INTO v_current USING v_tx.user_id;

    v_new_balance := v_current - v_tx.amount;
    IF v_new_balance < 0 THEN v_new_balance := 0; END IF;

    EXECUTE format('UPDATE public.profiles SET %I = $1 WHERE id = $2', v_col)
    USING v_new_balance, v_tx.user_id;
  END IF;

  -- Delete the transaction
  DELETE FROM public.transactions WHERE id = p_tx_id;

  RETURN jsonb_build_object(
    'success', true,
    'reversed_amount', v_tx.amount,
    'currency_type', v_tx.currency_type,
    'new_balance', COALESCE(v_new_balance, 0)
  );
END;
$function$;

-- Preserve grants
REVOKE EXECUTE ON FUNCTION public.admin_delete_transaction(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_delete_transaction(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_transaction(uuid) TO authenticated;
