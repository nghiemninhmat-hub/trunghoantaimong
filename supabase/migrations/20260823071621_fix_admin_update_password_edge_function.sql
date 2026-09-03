-- Fix: admin_update_user_password fails when called from the edge function
-- Root cause: The edge function calls this RPC with the service_role key via REST API.
-- In that context, session_user = 'authenticator' (no bypassrls) and auth.uid() = NULL (no user JWT).
-- The function's first check: "IF coalesce(v_can_bypass, false) = false AND v_admin_id IS NULL THEN RAISE"
-- This always fires when called from the edge function, blocking all password updates.
--
-- Fix: Add p_admin_id parameter so the edge function can pass the admin's UUID.
-- The edge function already verifies admin status via is_admin() RPC call with the user's JWT
-- before calling this function. So we trust the caller's admin check and use p_admin_id for audit logging.
-- When called directly by an authenticated admin (not via edge function), auth.uid() is used as fallback.

CREATE OR REPLACE FUNCTION public.admin_update_user_password(p_user_id uuid, p_new_password text, p_admin_id uuid DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'auth'
AS $function$
DECLARE
v_caller_uid uuid := coalesce(p_admin_id, auth.uid());
v_old_password text;
v_can_bypass boolean;
BEGIN
SELECT rolbypassrls INTO v_can_bypass FROM pg_roles WHERE rolname = session_user;

-- Allow if: service_role bypass OR a valid admin user_id was provided
IF coalesce(v_can_bypass, false) = false AND v_caller_uid IS NULL THEN
RAISE EXCEPTION 'Bạn phải đăng nhập để thực hiện.';
END IF;

IF coalesce(v_can_bypass, false) = false THEN
IF NOT public.is_admin() AND p_admin_id IS NOT NULL THEN
-- Edge function path: verify the provided admin_id is actually an admin
PERFORM 1 FROM public.profiles WHERE id = p_admin_id AND email IN (
'kinhnha010@gmail.com',
'hamthien53@gmail.com',
'Ngoncanhtac001@gmail.com',
'thanhhuyenbsc@gmail.com',
'dungchikienn@gmail.com',
'vinhtongthuong@gmail.com'
);
IF NOT FOUND THEN
RAISE EXCEPTION 'Chỉ quản trị viên mới có quyền đổi mật khẩu.';
END IF;
ELSIF coalesce(v_can_bypass, false) = false AND NOT public.is_admin() THEN
RAISE EXCEPTION 'Chỉ quản trị viên mới có quyền đổi mật khẩu.';
END IF;
END IF;

IF p_new_password IS NULL OR length(p_new_password) < 6 THEN
RAISE EXCEPTION 'Mật khẩu phải có ít nhất 6 ký tự.';
END IF;

SELECT password INTO v_old_password FROM public.profiles WHERE id = p_user_id;

-- 1. Update auth.users.encrypted_password with bcrypt cost 10 (matches GoTrue default)
-- Also set email_confirmed_at so login works immediately
UPDATE auth.users
SET encrypted_password = crypt(p_new_password, gen_salt('bf', 10)),
email_confirmed_at = COALESCE(email_confirmed_at, now()),
updated_at = now()
WHERE id = p_user_id;

IF NOT FOUND THEN
RAISE EXCEPTION 'Không tìm thấy tài khoản.';
END IF;

-- 2. Revoke all refresh tokens (forces re-login with new password)
UPDATE auth.refresh_tokens
SET revoked = true, updated_at = now()
WHERE user_id = p_user_id::text AND revoked = false;

-- 3. Delete all sessions (invalidates active sessions immediately)
DELETE FROM auth.sessions WHERE user_id = p_user_id;

-- 4. Sync profiles.password (what admin sees in dashboard)
UPDATE public.profiles
SET password = p_new_password
WHERE id = p_user_id;

-- 5. Save to password history
INSERT INTO public.password_history (user_id, old_password, new_password, changed_by)
VALUES (p_user_id, v_old_password, p_new_password, coalesce(v_caller_uid, '00000000-0000-0000-0000-000000000000'::uuid));

RETURN jsonb_build_object('success', true);
END;
$function$;