-- Self-service password reset: player enters email + new password, system syncs both tables
CREATE OR REPLACE FUNCTION public.user_reset_own_password(p_email text, p_new_password text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'auth'
AS $function$
DECLARE
  v_profile public.profiles%ROWTYPE;
  v_old_password text;
BEGIN
  -- Validate
  IF p_email IS NULL OR trim(p_email) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Vui lòng nhập email.');
  END IF;

  IF p_new_password IS NULL OR length(p_new_password) < 6 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Mật khẩu phải có ít nhất 6 ký tự.');
  END IF;

  -- Find the profile by email (case-insensitive)
  SELECT * INTO v_profile FROM public.profiles WHERE lower(email) = lower(trim(p_email));

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy tài khoản với email này.');
  END IF;

  IF v_profile.is_approved = false THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tài khoản chưa được phê duyệt.');
  END IF;

  v_old_password := v_profile.password;

  -- 1. Update auth.users.encrypted_password (bcrypt cost 10)
  UPDATE auth.users
  SET encrypted_password = crypt(p_new_password, gen_salt('bf', 10)),
      email_confirmed_at = COALESCE(email_confirmed_at, now()),
      updated_at = now()
  WHERE id = v_profile.id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không tìm thấy tài khoản xác thực.');
  END IF;

  -- 2. Revoke all refresh tokens
  UPDATE auth.refresh_tokens
  SET revoked = true, updated_at = now()
  WHERE user_id = v_profile.id::text AND revoked = false;

  -- 3. Delete all sessions
  DELETE FROM auth.sessions WHERE user_id = v_profile.id;

  -- 4. Sync profiles.password
  UPDATE public.profiles
  SET password = p_new_password
  WHERE id = v_profile.id;

  -- 5. Save to password history
  INSERT INTO public.password_history (user_id, old_password, new_password, changed_by)
  VALUES (v_profile.id, v_old_password, p_new_password, v_profile.id);

  RETURN jsonb_build_object('success', true);
END;
$function$;

-- Allow anon and authenticated to call this function (no login required for password reset)
GRANT EXECUTE ON FUNCTION public.user_reset_own_password(text, text) TO anon, authenticated;