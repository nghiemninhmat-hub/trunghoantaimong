/*
# Add Bulk Admin Features

## Overview
Adds three server-side functions for bulk admin operations:
1. Broadcast notification to ALL players
2. Bulk currency grant to ALL players (with transaction logging)
3. Recreates avatar frame system with bulk grant capability

## 1. admin_broadcast_notification function
- SECURITY DEFINER function callable only by admins
- Inserts a single notification row with recipient_id = NULL (broadcast)
- All authenticated users see broadcast notifications (per existing RLS policy)
- Logs the action to admin_audit_log

## 2. admin_bulk_grant_currency function
- SECURITY DEFINER function callable only by admins
- Adds a specified amount of currency (hua_tien / cong_duc / am_duc) to ALL approved, non-disabled players
- Logs a transaction for each player with reason prefix [QTV-BULK]
- Returns the count of affected players

## 3. Avatar Frame System (recreated)
- avatar_frames table: catalog of frames (key, name, image_path, currency_type, price)
- user_avatar_frames table: ownership records (user_id, frame_id)
- active_frame_id column on profiles
- admin_bulk_grant_avatar_frame function: grants a frame to ALL approved, non-disabled players at once
- RLS: public read on avatar_frames, owner-scoped on user_avatar_frames, admin-only writes on frames

## Security
- All functions are SECURITY DEFINER with search_path = public
- REVOKE from anon/PUBLIC, GRANT to authenticated
- Functions check is_admin() before performing any action
- avatar_frames: public SELECT, admin-only INSERT/UPDATE/DELETE
- user_avatar_frames: owner-scoped SELECT/INSERT/DELETE
*/

-- ============================================================
-- 1. Admin broadcast notification function
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_broadcast_notification(
  p_title text,
  p_body text,
  p_link text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
  v_notif_id uuid;
BEGIN
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Bạn phải đăng nhập để thực hiện.';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên mới có thể phát thông báo toàn hệ thống.';
  END IF;

  IF p_title IS NULL OR btrim(p_title) = '' THEN
    RAISE EXCEPTION 'Tiêu đề thông báo không được để trống.';
  END IF;

  INSERT INTO public.notifications (recipient_id, type, title, body, link)
  VALUES (NULL, 'admin_broadcast', p_title, p_body, p_link)
  RETURNING id INTO v_notif_id;

  INSERT INTO public.admin_audit_log (admin_id, action, target_description, details)
  VALUES (
    v_admin_id,
    'broadcast_notification',
    'Phát thông báo toàn hệ thống: ' || p_title,
    jsonb_build_object('notification_id', v_notif_id, 'title', p_title, 'body', p_body)
  );

  RETURN jsonb_build_object('success', true, 'notification_id', v_notif_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_broadcast_notification(text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_broadcast_notification(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_broadcast_notification(text, text, text) TO authenticated;

-- ============================================================
-- 2. Admin bulk grant currency function
-- ============================================================

CREATE OR REPLACE FUNCTION public.admin_bulk_grant_currency(
  p_currency_type text,
  p_amount int,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
  v_count int := 0;
  v_final_reason text;
  v_col text;
BEGIN
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Bạn phải đăng nhập để thực hiện.';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên mới có thể cấp tài sản hàng loạt.';
  END IF;

  IF p_currency_type NOT IN ('HUA_TIEN', 'CONG_DUC', 'AM_DUC') THEN
    RAISE EXCEPTION 'Loại tiền không hợp lệ. Sử dụng: HUA_TIEN, CONG_DUC, hoặc AM_DUC.';
  END IF;

  IF p_amount = 0 THEN
    RAISE EXCEPTION 'Số tiền phải khác 0.';
  END IF;

  IF p_reason IS NULL OR btrim(p_reason) = '' THEN
    RAISE EXCEPTION 'Lý do không được để trống.';
  END IF;

  v_final_reason := '[QTV-BULK] ' || btrim(p_reason);

  IF p_currency_type = 'HUA_TIEN' THEN
    UPDATE public.profiles
    SET hua_tien = hua_tien + p_amount
    WHERE is_approved = true AND COALESCE(is_disabled, false) = false;
    GET DIAGNOSTICS v_count = ROW_COUNT;

    INSERT INTO public.transactions (user_id, amount, currency_type, reason)
    SELECT id, p_amount, 'HUA_TIEN', v_final_reason
    FROM public.profiles
    WHERE is_approved = true AND COALESCE(is_disabled, false) = false;

  ELSIF p_currency_type = 'CONG_DUC' THEN
    UPDATE public.profiles
    SET cong_duc = cong_duc + p_amount
    WHERE is_approved = true AND COALESCE(is_disabled, false) = false;
    GET DIAGNOSTICS v_count = ROW_COUNT;

    INSERT INTO public.transactions (user_id, amount, currency_type, reason)
    SELECT id, p_amount, 'CONG_DUC', v_final_reason
    FROM public.profiles
    WHERE is_approved = true AND COALESCE(is_disabled, false) = false;

  ELSIF p_currency_type = 'AM_DUC' THEN
    UPDATE public.profiles
    SET am_duc = am_duc + p_amount
    WHERE is_approved = true AND COALESCE(is_disabled, false) = false;
    GET DIAGNOSTICS v_count = ROW_COUNT;

    INSERT INTO public.transactions (user_id, amount, currency_type, reason)
    SELECT id, p_amount, 'AM_DUC', v_final_reason
    FROM public.profiles
    WHERE is_approved = true AND COALESCE(is_disabled, false) = false;
  END IF;

  INSERT INTO public.admin_audit_log (admin_id, action, target_description, details)
  VALUES (
    v_admin_id,
    'bulk_grant_currency',
    'Cấp ' || p_currency_type || ' x' || p_amount || ' cho ' || v_count || ' người chơi',
    jsonb_build_object('currency_type', p_currency_type, 'amount', p_amount, 'reason', p_reason, 'affected_count', v_count)
  );

  RETURN jsonb_build_object('success', true, 'affected_count', v_count);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_bulk_grant_currency(text, int, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_bulk_grant_currency(text, int, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_bulk_grant_currency(text, int, text) TO authenticated;

-- ============================================================
-- 3. Recreate Avatar Frame System
-- ============================================================

-- 3a. avatar_frames catalog table
CREATE TABLE IF NOT EXISTS public.avatar_frames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  frame_key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  image_path text NOT NULL,
  currency_type text NOT NULL CHECK (currency_type IN ('hua_tien', 'cong_duc', 'am_duc')),
  price integer NOT NULL DEFAULT 0,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.avatar_frames ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS avatar_frames_select_all ON public.avatar_frames;
CREATE POLICY avatar_frames_select_all ON public.avatar_frames
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS avatar_frames_admin_insert ON public.avatar_frames;
CREATE POLICY avatar_frames_admin_insert ON public.avatar_frames
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS avatar_frames_admin_update ON public.avatar_frames;
CREATE POLICY avatar_frames_admin_update ON public.avatar_frames
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS avatar_frames_admin_delete ON public.avatar_frames;
CREATE POLICY avatar_frames_admin_delete ON public.avatar_frames
  FOR DELETE TO authenticated USING (public.is_admin());

-- 3b. user_avatar_frames ownership table
CREATE TABLE IF NOT EXISTS public.user_avatar_frames (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  frame_id uuid NOT NULL REFERENCES public.avatar_frames(id) ON DELETE CASCADE,
  purchased_at timestamptz DEFAULT now(),
  UNIQUE(user_id, frame_id)
);

ALTER TABLE public.user_avatar_frames ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_avatar_frames_select_own ON public.user_avatar_frames;
CREATE POLICY user_avatar_frames_select_own ON public.user_avatar_frames
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_avatar_frames_insert_own ON public.user_avatar_frames;
CREATE POLICY user_avatar_frames_insert_own ON public.user_avatar_frames
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS user_avatar_frames_delete_own ON public.user_avatar_frames;
CREATE POLICY user_avatar_frames_delete_own ON public.user_avatar_frames
  FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- 3c. Add active_frame_id to profiles (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'active_frame_id'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN active_frame_id uuid REFERENCES public.avatar_frames(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 3d. Seed frames
INSERT INTO public.avatar_frames (frame_key, name, description, image_path, currency_type, price, display_order) VALUES
  ('phoenix', 'Phượng Hoàng Cổ Văn', 'Sang trọng, lộng lẫy — dành cho tài khoản nữ, vai VIP, hoàng hậu, nữ vương.', '/images/avatar-frames/phoenix.svg', 'hua_tien', 3000, 1),
  ('dragon', 'Cửu Long Vờn Mây', 'Vương giả, uy nghi — dành cho tài khoản nam, vai Tông chủ, Hoàng đế, Bang chủ.', '/images/avatar-frames/dragon.svg', 'hua_tien', 4000, 2),
  ('peony', 'Hoa Mẫu Đơn Phi Yên', 'Quý phái, tinh tế — phong cách quý tộc, thanh lịch, tiên khí.', '/images/avatar-frames/peony.svg', 'cong_duc', 300, 3),
  ('lotus', 'Hoa Sen Đồng Cổ', 'Cổ kính, thanh nhã — phong cách kiếm hiệp, ẩn sĩ, cao nhân cổ đại.', '/images/avatar-frames/lotus.svg', 'cong_duc', 500, 4),
  ('dragon-king', 'Thiên Đế Long Vương', 'Quyền lực hoàng gia, tuyệt đối — nhân vật nam quyền lực nhất, Tông chủ, Quốc vương.', '/images/avatar-frames/dragon-king.svg', 'cong_duc', 1000, 5),
  ('snow-lotus', 'Tuyết Liên Ngọc Điệp', 'Thanh thuần, thoát tục — nhân vật nữ thanh lịch, Tiên tử, Thánh nữ.', '/images/avatar-frames/snow-lotus.svg', 'cong_duc', 1200, 6),
  ('mythical-beast', 'Cổ Miếu Thần Thú', 'Bí ẩn, trấn phái — nhân vật hệ ma thuật, ẩn sĩ cao cường, chưởng môn ma giáo.', '/images/avatar-frames/mythical-beast.svg', 'am_duc', 400, 7),
  ('peacock', 'Khổng Tước Khai Hoa', 'Rực rỡ, phú quý — nhân vật phú quý, thương gia VIP, cá tính mạnh, thích nổi bật.', '/images/avatar-frames/peacock.svg', 'am_duc', 800, 8)
ON CONFLICT (frame_key) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  image_path = EXCLUDED.image_path,
  currency_type = EXCLUDED.currency_type,
  price = EXCLUDED.price,
  display_order = EXCLUDED.display_order;

-- 3e. Purchase function (recreated)
CREATE OR REPLACE FUNCTION public.purchase_avatar_frame(p_frame_id uuid)
RETURNS TABLE(success boolean, message text, new_hua_tien integer, new_cong_duc integer, new_am_duc integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
DECLARE
  v_frame public.avatar_frames%ROWTYPE;
  v_user_id uuid := auth.uid();
  v_already_owns boolean;
  v_new_ht integer;
  v_new_cd integer;
  v_new_ad integer;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, 'Vui lòng đăng nhập', NULL, NULL, NULL;
    RETURN;
  END IF;

  SELECT * INTO v_frame FROM public.avatar_frames WHERE id = p_frame_id;
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, 'Khung viền không tồn tại', NULL, NULL, NULL;
    RETURN;
  END IF;

  SELECT EXISTS(SELECT 1 FROM public.user_avatar_frames WHERE user_id = v_user_id AND frame_id = p_frame_id) INTO v_already_owns;
  IF v_already_owns THEN
    RETURN QUERY SELECT true, 'Đã sở hữu khung viền này', NULL, NULL, NULL;
    RETURN;
  END IF;

  IF v_frame.currency_type = 'hua_tien' THEN
    UPDATE public.profiles SET hua_tien = hua_tien - v_frame.price
    WHERE id = v_user_id AND hua_tien >= v_frame.price
    RETURNING hua_tien INTO v_new_ht;
    IF NOT FOUND THEN
      RETURN QUERY SELECT false, 'Không đủ hoa tiền', NULL, NULL, NULL;
      RETURN;
    END IF;
    SELECT cong_duc, am_duc INTO v_new_cd, v_new_ad FROM public.profiles WHERE id = v_user_id;
  ELSIF v_frame.currency_type = 'cong_duc' THEN
    UPDATE public.profiles SET cong_duc = cong_duc - v_frame.price
    WHERE id = v_user_id AND cong_duc >= v_frame.price
    RETURNING cong_duc INTO v_new_cd;
    IF NOT FOUND THEN
      RETURN QUERY SELECT false, 'Không đủ công đức', NULL, NULL, NULL;
      RETURN;
    END IF;
    SELECT hua_tien, am_duc INTO v_new_ht, v_new_ad FROM public.profiles WHERE id = v_user_id;
  ELSIF v_frame.currency_type = 'am_duc' THEN
    UPDATE public.profiles SET am_duc = am_duc - v_frame.price
    WHERE id = v_user_id AND am_duc >= v_frame.price
    RETURNING am_duc INTO v_new_ad;
    IF NOT FOUND THEN
      RETURN QUERY SELECT false, 'Không đủ âm đức', NULL, NULL, NULL;
      RETURN;
    END IF;
    SELECT hua_tien, cong_duc INTO v_new_ht, v_new_cd FROM public.profiles WHERE id = v_user_id;
  END IF;

  INSERT INTO public.user_avatar_frames (user_id, frame_id) VALUES (v_user_id, p_frame_id);

  INSERT INTO public.transactions (user_id, amount, currency_type, reason)
  VALUES (v_user_id, -v_frame.price, UPPER(v_frame.currency_type), 'Mua khung viền: ' || v_frame.name);

  RETURN QUERY SELECT true, 'Mua thành công', v_new_ht, v_new_cd, v_new_ad;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.purchase_avatar_frame(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.purchase_avatar_frame(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.purchase_avatar_frame(uuid) TO authenticated;

-- 3f. Equip function (recreated)
CREATE OR REPLACE FUNCTION public.equip_avatar_frame(p_frame_id uuid)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
  v_owns boolean;
BEGIN
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, 'Vui lòng đăng nhập';
    RETURN;
  END IF;

  SELECT EXISTS(SELECT 1 FROM public.user_avatar_frames WHERE user_id = v_user_id AND frame_id = p_frame_id) INTO v_owns;
  IF NOT v_owns THEN
    RETURN QUERY SELECT false, 'Bạn chưa sở hữu khung viền này';
    RETURN;
  END IF;

  UPDATE public.profiles SET active_frame_id = p_frame_id WHERE id = v_user_id;
  RETURN QUERY SELECT true, 'Đã áp dụng khung viền';
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.equip_avatar_frame(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.equip_avatar_frame(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.equip_avatar_frame(uuid) TO authenticated;

-- 3g. Unequip function (recreated)
CREATE OR REPLACE FUNCTION public.unequip_avatar_frame()
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO public
AS $function$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT false, 'Vui lòng đăng nhập';
    RETURN;
  END IF;

  UPDATE public.profiles SET active_frame_id = NULL WHERE id = v_user_id;
  RETURN QUERY SELECT true, 'Đã gỡ khung viền';
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.unequip_avatar_frame() FROM anon;
REVOKE EXECUTE ON FUNCTION public.unequip_avatar_frame() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.unequip_avatar_frame() TO authenticated;

-- 3h. Admin bulk grant avatar frame to ALL players
CREATE OR REPLACE FUNCTION public.admin_bulk_grant_avatar_frame(p_frame_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_admin_id uuid := auth.uid();
  v_frame public.avatar_frames%ROWTYPE;
  v_count int := 0;
BEGIN
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Bạn phải đăng nhập để thực hiện.';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên mới có thể cấp khung viền hàng loạt.';
  END IF;

  SELECT * INTO v_frame FROM public.avatar_frames WHERE id = p_frame_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Khung viền không tồn tại.';
  END IF;

  -- Insert ownership for all approved, non-disabled players who don't already own it
  INSERT INTO public.user_avatar_frames (user_id, frame_id)
  SELECT p.id, p_frame_id
  FROM public.profiles p
  WHERE p.is_approved = true
    AND COALESCE(p.is_disabled, false) = false
    AND NOT EXISTS (
      SELECT 1 FROM public.user_avatar_frames uaf
      WHERE uaf.user_id = p.id AND uaf.frame_id = p_frame_id
    );
  GET DIAGNOSTICS v_count = ROW_COUNT;

  INSERT INTO public.admin_audit_log (admin_id, action, target_description, details)
  VALUES (
    v_admin_id,
    'bulk_grant_avatar_frame',
    'Cấp khung viền "' || v_frame.name || '" cho ' || v_count || ' người chơi',
    jsonb_build_object('frame_id', p_frame_id, 'frame_name', v_frame.name, 'affected_count', v_count)
  );

  RETURN jsonb_build_object('success', true, 'affected_count', v_count, 'frame_name', v_frame.name);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_bulk_grant_avatar_frame(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_bulk_grant_avatar_frame(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_bulk_grant_avatar_frame(uuid) TO authenticated;

-- Enable realtime for avatar_frames and user_avatar_frames
ALTER TABLE public.avatar_frames REPLICA IDENTITY FULL;
ALTER TABLE public.user_avatar_frames REPLICA IDENTITY FULL;