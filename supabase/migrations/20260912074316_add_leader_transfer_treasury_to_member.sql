/*
# Leader Transfer Treasury to Member

## Purpose
Allows an organization leader to transfer assets FROM the org treasury TO a specific
member's personal balance. This complements the existing `contribute_org_treasury`
function (which moves assets between a member's personal balance and the treasury).

## New Function: `leader_transfer_treasury_to_member`
- Parameters: p_org_id, p_member_user_id, p_currency_type, p_amount, p_reason
- Verifies the caller is the leader of the organization.
- Verifies the target user is a member of the organization.
- Deducts the amount from the org treasury balance (fails if insufficient).
- Adds the amount to the target member's personal balance.
- Logs in both `organization_treasury_logs` and `transactions` tables.
- SECURITY DEFINER, SET search_path TO 'public', execute granted to authenticated only.

## Security
- Only the org leader can call this function (verified via leader_id check).
- Treasury balance cannot go negative.
- All changes are logged in treasury logs and the member's transaction history.
*/

CREATE OR REPLACE FUNCTION public.leader_transfer_treasury_to_member(
  p_org_id uuid,
  p_member_user_id uuid,
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
  v_is_leader boolean;
  v_is_member boolean;
  v_org_name text;
  v_col text;
  v_treasury_current bigint;
  v_treasury_new bigint;
  v_personal_current int;
  v_personal_new int;
  v_leader_name text;
  v_member_name text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Bạn phải đăng nhập để thực hiện.';
  END IF;

  IF p_currency_type NOT IN ('HUA_TIEN', 'CONG_DUC', 'AM_DUC') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Loại tiền tệ không hợp lệ');
  END IF;
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Số lượng phải lớn hơn 0');
  END IF;
  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Lý do là bắt buộc');
  END IF;

  -- Check if caller is the leader
  SELECT (leader_id = v_uid) INTO v_is_leader FROM organizations WHERE id = p_org_id;
  IF v_is_leader IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tổ chức không tồn tại');
  END IF;
  IF NOT v_is_leader THEN
    RETURN jsonb_build_object('success', false, 'error', 'Chỉ người đứng đầu mới được chuyển tài sản cho thành viên');
  END IF;

  -- Check if target is a member
  SELECT EXISTS(
    SELECT 1 FROM organization_members
    WHERE organization_id = p_org_id AND user_id = p_member_user_id
  ) INTO v_is_member;
  IF NOT v_is_member THEN
    RETURN jsonb_build_object('success', false, 'error', 'Người nhận không phải thành viên của tổ chức');
  END IF;

  SELECT name INTO v_org_name FROM organizations WHERE id = p_org_id;
  SELECT oc_name INTO v_leader_name FROM profiles WHERE id = v_uid;
  SELECT oc_name INTO v_member_name FROM profiles WHERE id = p_member_user_id;

  -- Map currency type to column
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

  v_treasury_new := v_treasury_current - p_amount;
  IF v_treasury_new < 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Số dư tổ chức không đủ');
  END IF;

  -- Update treasury balance
  EXECUTE format('UPDATE organization_treasuries SET %I = $1, updated_at = now() WHERE organization_id = $2', p_currency_type)
    USING v_treasury_new, p_org_id;
  IF NOT FOUND THEN
    INSERT INTO organization_treasuries (organization_id, hua_tien, cong_duc, am_duc)
    VALUES (p_org_id, 0, 0, 0) ON CONFLICT (organization_id) DO NOTHING;
    EXECUTE format('UPDATE organization_treasuries SET %I = $1, updated_at = now() WHERE organization_id = $2', p_currency_type)
      USING v_treasury_new, p_org_id;
  END IF;

  -- Add to member's personal balance
  EXECUTE format('SELECT %I FROM profiles WHERE id = $1', v_col)
    INTO v_personal_current USING p_member_user_id;
  IF v_personal_current IS NULL THEN v_personal_current := 0; END IF;

  v_personal_new := v_personal_current + p_amount;

  EXECUTE format('UPDATE profiles SET %I = $1 WHERE id = $2', v_col)
    USING v_personal_new, p_member_user_id;

  -- Log in treasury logs
  INSERT INTO organization_treasury_logs (organization_id, actor_id, actor_name, currency_type, amount, reason, balance_after)
  VALUES (p_org_id, v_uid, v_leader_name, p_currency_type, -p_amount, 'Chuyển cho thành viên ' || v_member_name || ': ' || p_reason, v_treasury_new);

  -- Log in member's transactions
  INSERT INTO transactions (user_id, amount, currency_type, reason, related_user_name)
  VALUES (
    p_member_user_id,
    p_amount,
    p_currency_type,
    'Nhận từ tổ chức ' || v_org_name || ': ' || p_reason,
    v_org_name
  );

  RETURN jsonb_build_object(
    'success', true,
    'treasury_balance', v_treasury_new,
    'member_balance', v_personal_new
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.leader_transfer_treasury_to_member(uuid, uuid, text, bigint, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.leader_transfer_treasury_to_member(uuid, uuid, text, bigint, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.leader_transfer_treasury_to_member(uuid, uuid, text, bigint, text) TO authenticated;
