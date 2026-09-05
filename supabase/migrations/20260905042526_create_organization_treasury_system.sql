/*
# Organization Treasury System

## Purpose
Adds a shared treasury for each organization. The organization leader can
add/subtract assets (Hoa Tiền, Công Đức, Âm Đức) with a reason. All changes
are logged. Real-time updates are enabled.

## New Tables
- `organization_treasuries`: one row per org, stores current balances
  - organization_id (uuid, FK to organizations, unique)
  - hua_tien (bigint, default 0)
  - cong_duc (bigint, default 0)
  - am_duc (bigint, default 0)
  - updated_at (timestamptz)

- `organization_treasury_logs`: audit trail of every treasury adjustment
  - organization_id (uuid, FK)
  - actor_id (uuid, FK to auth.users)
  - actor_name (text)
  - currency_type (text: HUA_TIEN | CONG_DUC | AM_DUC)
  - amount (bigint, positive = add, negative = subtract)
  - reason (text, required)
  - balance_after (bigint)
  - created_at (timestamptz)

## Security
- RLS enabled on both tables
- Any authenticated user can READ treasury balances and logs (public info)
- Only the org leader can adjust via the `adjust_org_treasury` function (SECURITY DEFINER)
- Direct INSERT/UPDATE/DELETE on treasury table is denied to all non-admin roles

## Function
- `adjust_org_treasury(p_org_id, p_currency_type, p_amount, p_reason)`:
  Verifies caller is the leader of the org, updates the balance, logs the change.
  Returns jsonb with success/error.
*/

CREATE TABLE IF NOT EXISTS organization_treasuries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  hua_tien bigint NOT NULL DEFAULT 0,
  cong_duc bigint NOT NULL DEFAULT 0,
  am_duc bigint NOT NULL DEFAULT 0,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(organization_id)
);

ALTER TABLE organization_treasuries ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_org_treasury" ON organization_treasuries;
CREATE POLICY "read_org_treasury" ON organization_treasuries
  FOR SELECT TO authenticated USING (true);

CREATE TABLE IF NOT EXISTS organization_treasury_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  actor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  actor_name text,
  currency_type text NOT NULL,
  amount bigint NOT NULL,
  reason text NOT NULL,
  balance_after bigint NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE organization_treasury_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read_org_treasury_logs" ON organization_treasury_logs;
CREATE POLICY "read_org_treasury_logs" ON organization_treasury_logs
  FOR SELECT TO authenticated USING (true);

CREATE INDEX IF NOT EXISTS idx_org_treasury_logs_org_id ON organization_treasury_logs(organization_id, created_at DESC);

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE organization_treasuries;
ALTER PUBLICATION supabase_realtime ADD TABLE organization_treasury_logs;

-- Function: leader adjusts treasury
CREATE OR REPLACE FUNCTION public.adjust_org_treasury(
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
  v_leader_id uuid;
  v_current bigint;
  v_new bigint;
  v_actor_name text;
BEGIN
  IF p_currency_type NOT IN ('HUA_TIEN', 'CONG_DUC', 'AM_DUC') THEN
    RETURN jsonb_build_object('success', false, 'error', 'Loại tiền tệ không hợp lệ');
  END IF;
  IF p_amount = 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Số lượng phải khác 0');
  END IF;
  IF p_reason IS NULL OR trim(p_reason) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Lý do là bắt buộc');
  END IF;

  SELECT leader_id INTO v_leader_id FROM organizations WHERE id = p_org_id;
  IF v_leader_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tổ chức không tồn tại');
  END IF;
  IF v_leader_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Chỉ người đứng đầu mới được thao tác');
  END IF;

  SELECT oc_name INTO v_actor_name FROM profiles WHERE id = auth.uid();

  -- Get current balance
  EXECUTE format('SELECT %I FROM organization_treasuries WHERE organization_id = $1', p_currency_type)
    INTO v_current USING p_org_id;
  IF v_current IS NULL THEN
    v_current := 0;
    INSERT INTO organization_treasuries (organization_id) VALUES (p_org_id) ON CONFLICT DO NOTHING;
  END IF;

  v_new := v_current + p_amount;
  IF v_new < 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Số dư không đủ');
  END IF;

  -- Update balance
  EXECUTE format('UPDATE organization_treasuries SET %I = $1, updated_at = now() WHERE organization_id = $2', p_currency_type)
    USING v_new, p_org_id;
  IF NOT FOUND THEN
    INSERT INTO organization_treasuries (organization_id, hua_tien, cong_duc, am_duc)
    VALUES (p_org_id, 0, 0, 0)
    ON CONFLICT (organization_id) DO NOTHING;
    EXECUTE format('UPDATE organization_treasuries SET %I = $1, updated_at = now() WHERE organization_id = $2', p_currency_type)
      USING v_new, p_org_id;
  END IF;

  -- Log
  INSERT INTO organization_treasury_logs (organization_id, actor_id, actor_name, currency_type, amount, reason, balance_after)
  VALUES (p_org_id, auth.uid(), v_actor_name, p_currency_type, p_amount, p_reason, v_new);

  RETURN jsonb_build_object('success', true, 'balance_after', v_new);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.adjust_org_treasury(uuid, text, bigint, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.adjust_org_treasury(uuid, text, bigint, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.adjust_org_treasury(uuid, text, bigint, text) TO authenticated;
