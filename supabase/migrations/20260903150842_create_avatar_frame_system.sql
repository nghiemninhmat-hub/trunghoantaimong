/*
# Avatar Frame System

1. New Tables
- `avatar_frames`: catalog of 8 purchasable avatar frames (name, description, image path, currency type, price)
- `user_avatar_frames`: ownership records — which user owns which frame

2. Profile Changes
- Add `active_frame_id` column to `profiles` to track the currently equipped frame

3. Security
- `avatar_frames`: public read, admin-only write
- `user_avatar_frames`: owner-scoped CRUD
- Purchase function `purchase_avatar_frame` is SECURITY DEFINER — atomically deducts currency and records ownership
- Equip function `equip_avatar_frame` validates ownership before setting active

4. Currency Types
- 'hua_tien' (hoa tiền) — frames 1-2
- 'cong_duc' (công đức) — frames 3-5-6
- 'am_duc' (âm đức) — frames 7-8
*/

-- 1. Create avatar_frames catalog table
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

-- 2. Create user_avatar_frames ownership table
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

-- 3. Add active_frame_id to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS active_frame_id uuid REFERENCES public.avatar_frames(id) ON DELETE SET NULL;

-- 4. Seed the 8 frames
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

-- 5. Purchase function
CREATE OR REPLACE FUNCTION public.purchase_avatar_frame(p_frame_id uuid)
RETURNS TABLE(success boolean, message text, new_hua_tien integer, new_cong_duc integer, new_am_duc integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

  INSERT INTO public.transactions (user_id, type, amount, description)
  VALUES (v_user_id, 'spend', -v_frame.price, 'Mua khung viền: ' || v_frame.name);

  RETURN QUERY SELECT true, 'Mua thành công', v_new_ht, v_new_cd, v_new_ad;
END;
$function$;

-- 6. Equip function
CREATE OR REPLACE FUNCTION public.equip_avatar_frame(p_frame_id uuid)
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

-- 7. Unequip function
CREATE OR REPLACE FUNCTION public.unequip_avatar_frame()
RETURNS TABLE(success boolean, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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
