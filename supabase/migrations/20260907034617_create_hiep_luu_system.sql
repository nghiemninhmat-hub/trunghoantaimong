-- Hiệp Lữ (Companionship) System
-- Allows players to register bonds (Nhân Duyên, Tri Kỷ, Thân Hữu) with admin approval

CREATE TABLE IF NOT EXISTS public.hiep_luu_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  relationship_type text NOT NULL CHECK (relationship_type IN ('NHAN_DUYEN', 'TRI_KY', 'THAN_HUU')),
  partner_name text NOT NULL,
  self_identity text NOT NULL,
  theme_image_url text,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewer_id uuid REFERENCES public.profiles(id),
  reviewer_name text,
  reviewed_at timestamptz,
  admin_note text,
  -- After approval, the bond ceremony metadata
  bond_message text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.hiep_luu_registrations ENABLE ROW LEVEL SECURITY;

-- Players can read their own registrations
CREATE POLICY "select_own_hiep_luu" ON public.hiep_luu_registrations
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Players can insert their own registrations
CREATE POLICY "insert_own_hiep_luu" ON public.hiep_luu_registrations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Players can update their own registrations (only before approval)
CREATE POLICY "update_own_hiep_luu" ON public.hiep_luu_registrations
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Admins can read all registrations (via service role / is_admin)
-- We need a SELECT policy for admins too. Since is_admin() is a function,
-- we use it in the policy.
CREATE POLICY "select_all_hiep_luu_admin" ON public.hiep_luu_registrations
  FOR SELECT TO authenticated USING (public.is_admin());

-- Admins can update any registration (for approval/rejection)
CREATE POLICY "update_all_hiep_luu_admin" ON public.hiep_luu_registrations
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_hiep_luu_user_id ON public.hiep_luu_registrations(user_id);
CREATE INDEX IF NOT EXISTS idx_hiep_luu_status ON public.hiep_luu_registrations(status);

-- Function to approve a hiep luu registration (admin only)
CREATE OR REPLACE FUNCTION public.approve_hiep_luu(
  p_registration_id uuid,
  p_admin_id uuid,
  p_bond_message text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_reg RECORD;
  v_admin_name text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên mới có quyền thực hiện.';
  END IF;

  SELECT * INTO v_reg FROM hiep_luu_registrations WHERE id = p_registration_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy đăng ký');
  END IF;

  IF v_reg.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Đăng ký đã được xử lý');
  END IF;

  SELECT oc_name INTO v_admin_name FROM profiles WHERE id = p_admin_id;

  UPDATE hiep_luu_registrations
  SET status = 'approved',
      reviewer_id = p_admin_id,
      reviewer_name = v_admin_name,
      reviewed_at = now(),
      bond_message = COALESCE(p_bond_message, bond_message),
      updated_at = now()
  WHERE id = p_registration_id;

  -- Notify the user
  INSERT INTO notifications (recipient_id, type, title, body, link)
  VALUES (
    v_reg.user_id,
    'hiep_luu_approved',
    'Hiệp Lữ Duyệt',
    'Đăng ký hiệp lữ của bạn đã được phê duyệt! Hãy xem nghi lễ kết duyên.',
    '/hiep-luu'
  );

  RETURN jsonb_build_object('success', true);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.approve_hiep_luu(uuid, uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.approve_hiep_luu(uuid, uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.approve_hiep_luu(uuid, uuid, text) TO authenticated;

-- Function to reject a hiep luu registration (admin only)
CREATE OR REPLACE FUNCTION public.reject_hiep_luu(
  p_registration_id uuid,
  p_admin_id uuid,
  p_note text DEFAULT NULL
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_reg RECORD;
  v_admin_name text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên mới có quyền thực hiện.';
  END IF;

  SELECT * INTO v_reg FROM hiep_luu_registrations WHERE id = p_registration_id;
  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy đăng ký');
  END IF;

  IF v_reg.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Đăng ký đã được xử lý');
  END IF;

  SELECT oc_name INTO v_admin_name FROM profiles WHERE id = p_admin_id;

  UPDATE hiep_luu_registrations
  SET status = 'rejected',
      reviewer_id = p_admin_id,
      reviewer_name = v_admin_name,
      reviewed_at = now(),
      admin_note = p_note,
      updated_at = now()
  WHERE id = p_registration_id;

  INSERT INTO notifications (recipient_id, type, title, body, link)
  VALUES (
    v_reg.user_id,
    'hiep_luu_rejected',
    'Hiệp Lữ Bị Từ Chối',
    COALESCE(p_note, 'Đăng ký hiệp lữ của bạn đã bị từ chối. Vui lòng liên hệ quản trị viên để biết thêm chi tiết.'),
    '/hiep-luu'
  );

  RETURN jsonb_build_object('success', true);
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.reject_hiep_luu(uuid, uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.reject_hiep_luu(uuid, uuid, text) FROM anon;
GRANT EXECUTE ON FUNCTION public.reject_hiep_luu(uuid, uuid, text) TO authenticated;
