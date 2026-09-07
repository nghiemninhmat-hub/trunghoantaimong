/*
# Organization Treasury: Member Contributions + Transaction Logging

## Purpose
Extends the existing organization treasury system so that:
1. Any org member (not just the leader) can contribute assets to their org's treasury.
2. Admins can add/deduct org treasury assets directly.
3. All treasury adjustments are logged in the `transactions` table so they appear
   in the player's profile transaction history.

## Changes

### New Function: `contribute_org_treasury`
- Any authenticated user who is a member of the org can contribute (positive amount)
  or withdraw (negative amount, leader-only) from the treasury.
- Deducts the amount from the contributor's personal balance (for contributions).
- Updates the org treasury balance.
- Logs in both `organization_treasury_logs` and `transactions` tables.

### New Function: `admin_adjust_org_treasury`
- Admin-only function to add/deduct org treasury assets without affecting any player's personal balance.
- Logs in both `organization_treasury_logs` and `transactions` tables.

## Security
- Both functions: SECURITY DEFINER, SET search_path TO 'public'.
- Execute granted to `authenticated` only.
*/

-- Function: any org member contributes to treasury (deducted from personal balance)
CREATE OR REPLACE FUNCTION public.contribute_org_treasury(
  p_org_id uuid,
  p_currency_type text,
  p_amount bigint,
  p_reason text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_is_member boolean;
  v_is_leader boolean;
  v_org_name text;
  v_col text;
  v_personal_current int;
  v_personal_new int;
  v_treasury_current bigint;
  v_treasury_new bigint;
  v_actor_name text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Bạn phải đăng nhập để thực hiện.';
  END IF;

  IF p_currency_type NOT IN ('HUA_TIEN', 'CONG_DUC', 'AM_DUC') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Loại tiền tệ không hợp lệ');
  END IF;
  IF p_amount = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Số lượng phải khác 0');
  END IF;
  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Lý do là bắt buộc');
  END IF;

  -- Check membership
  SELECT EXISTS(
    SELECT 1 FROM organization_members
    WHERE organization_id = p_org_id AND user_id = v_uid
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bạn không phải thành viên của tổ chức này');
  END IF;

  -- Check if leader (for withdrawals)
  SELECT (leader_id = v_uid) INTO v_is_leader FROM organizations WHERE id = p_org_id;
  IF v_is_leader IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tổ chức không tồn tại');
  END IF;

  -- Only leader can withdraw (negative amount)
  IF p_amount < 0 AND NOT v_is_leader THEN
    RETURN jsonb_build_object('success', false, 'error', 'Chỉ người đứng đầu mới được rút tài sản');
  END IF;

  SELECT name INTO v_org_name FROM organizations WHERE id = p_org_id;
  SELECT oc_name INTO v_actor_name FROM profiles WHERE id = v_uid;

  -- Map currency type to column
  IF p_currency_type = 'HUA_TIEN' THEN v_col := 'hua_tien';
  ELSIF p_currency_type = 'CONG_DUC' THEN v_col := 'cong_duc';
  ELSIF p_currency_type = 'AM_DUC' THEN v_col := 'am_duc';
  END IF;

  -- Check and deduct from personal balance
  EXECUTE format('SELECT %I FROM profiles WHERE id = $1', v_col)
    INTO v_personal_current USING v_uid;
  IF v_personal_current IS NULL THEN v_personal_current := 0; END IF;

  v_personal_new := v_personal_current - p_amount;
  IF v_personal_new < 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Số dư cá nhân không đủ');
  END IF;

  EXECUTE format('UPDATE profiles SET %I = $1 WHERE id = $2', v_col)
    USING v_personal_new, v_uid;

  -- Update treasury balance
  EXECUTE format('SELECT %I FROM organization_treasuries WHERE organization_id = $1', p_currency_type)
    INTO v_treasury_current USING p_org_id;
  IF v_treasury_current IS NULL THEN
    v_treasury_current := 0;
    INSERT INTO organization_treasuries (organization_id) VALUES (p_org_id) ON CONFLICT DO NOTHING;
  END IF;

  v_treasury_new := v_treasury_current + p_amount;
  IF v_treasury_new < 0 THEN
    -- Refund personal balance
    EXECUTE format('UPDATE profiles SET %I = $1 WHERE id = $2', v_col)
      USING v_personal_current, v_uid;
    RETURN jsonb_build_object('success', false, 'error', 'Số dư tổ chức không đủ');
  END IF;

  EXECUTE format('UPDATE organization_treasuries SET %I = $1, updated_at = now() WHERE organization_id = $2', p_currency_type)
    USING v_treasury_new, p_org_id;
  IF NOT FOUND THEN
    INSERT INTO organization_treasuries (organization_id, hua_tien, cong_duc, am_duc)
    VALUES (p_org_id, 0, 0, 0) ON CONFLICT (organization_id) DO NOTHING;
    EXECUTE format('UPDATE organization_treasuries SET %I = $1, updated_at = now() WHERE organization_id = $2', p_currency_type)
      USING v_treasury_new, p_org_id;
  END IF;

  -- Log in treasury logs
  INSERT INTO organization_treasury_logs (organization_id, actor_id, actor_name, currency_type, amount, reason, balance_after)
  VALUES (p_org_id, v_uid, v_actor_name, p_currency_type, p_amount, p_reason, v_treasury_new);

  -- Log in player transactions
  INSERT INTO transactions (user_id, amount, currency_type, reason, related_user_name)
  VALUES (
    v_uid,
    -p_amount,
    p_currency_type,
    CASE WHEN p_amount > 0 THEN 'Đóng góp tài sản tổ chức: ' || v_org_name
         ELSE 'Rút tài sản từ tổ chức: ' || v_org_name
    END,
    v_org_name
  );

  RETURN jsonb_build_object(
    'success', true,
    'treasury_balance', v_treasury_new,
    'personal_balance', v_personal_new
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.contribute_org_treasury(uuid, text, bigint, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.contribute_org_treasury(uuid, text, bigint, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.contribute_org_treasury(uuid, text, bigint, text) TO authenticated;

-- Function: admin adjusts org treasury (no personal balance change)
CREATE OR REPLACE FUNCTION public.admin_adjust_org_treasury(
  p_org_id uuid,
  p_currency_type text,
  p_amount bigint,
  p_reason text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_uid uuid := auth.uid();
  v_org_name text;
  v_col text;
  v_treasury_current bigint;
  v_treasury_new bigint;
  v_actor_name text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Bạn phải đăng nhập để thực hiện.';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên mới có quyền thực hiện.';
  END IF;

  IF p_currency_type NOT IN ('HUA_TIEN', 'CONG_DUC', 'AM_DUC') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Loại tiền tệ không hợp lệ');
  END IF;
  IF p_amount = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Số lượng phải khác 0');
  END IF;
  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Lý do là bắt buộc');
  END IF;

  SELECT name INTO v_org_name FROM organizations WHERE id = p_org_id;
  IF v_org_name IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tổ chức không tồn tại');
  END IF;

  SELECT oc_name INTO v_actor_name FROM profiles WHERE id = v_uid;

  IF p_currency_type = 'HUA_TIEN' THEN v_col := 'hua_tien';
  ELSIF p_currency_type = 'CONG_DUC' THEN v_col := 'cong_duc';
  ELSIF p_currency_type = 'AM_DUC' THEN v_col := 'am_duc';
  END IF;

  -- Get current treasury balance
  EXECUTE format('SELECT %I FROM organization_treasuries WHERE organization_id = $1', p_currency_type)
    INTO v_treasury_current USING p_org_id;
  IF v_treasury_current IS NULL THEN
    v_treasury_current := 0;
    INSERT INTO organization_treasuries (organization_id) VALUES (p_org_id) ON CONFLICT DO NOTHING;
  END IF;

  v_treasury_new := v_treasury_current + p_amount;
  IF v_treasury_new < 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Số dư tổ chức không đủ');
  END IF;

  EXECUTE format('UPDATE organization_treasuries SET %I = $1, updated_at = now() WHERE organization_id = $2', p_currency_type)
    USING v_treasury_new, p_org_id;
  IF NOT FOUND THEN
    INSERT INTO organization_treasuries (organization_id, hua_tien, cong_duc, am_duc)
    VALUES (p_org_id, 0, 0, 0) ON CONFLICT (organization_id) DO NOTHING;
    EXECUTE format('UPDATE organization_treasuries SET %I = $1, updated_at = now() WHERE organization_id = $2', p_currency_type)
      USING v_treasury_new, p_org_id;
  END IF;

  -- Log in treasury logs
  INSERT INTO organization_treasury_logs (organization_id, actor_id, actor_name, currency_type, amount, reason, balance_after)
  VALUES (p_org_id, v_uid, v_actor_name, p_currency_type, p_amount, p_reason, v_treasury_new);

  -- Log in transactions (admin action, user_id = admin)
  INSERT INTO transactions (user_id, amount, currency_type, reason, related_user_name)
  VALUES (
    v_uid,
    0,
    p_currency_type,
    'Quản trị — ' || CASE WHEN p_amount > 0 THEN 'cộng ' ELSE 'trừ ' END
      || abs(p_amount) || ' ' || p_currency_type || ' vào tổ chức ' || v_org_name || ': ' || p_reason,
    v_org_name
  );

  RETURN jsonb_build_object(
    'success', true,
    'treasury_balance', v_treasury_new
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.admin_adjust_org_treasury(uuid, text, bigint, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_adjust_org_treasury(uuid, text, bigint, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.admin_adjust_org_treasury(uuid, text, bigint, text) TO authenticated;
