-- Fix: net.http_post takes jsonb body, not text
CREATE OR REPLACE FUNCTION public.admin_update_user_password(
  p_user_id uuid,
  p_new_password text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'extensions', 'net'
AS $function$
DECLARE
  v_admin_id uuid := auth.uid();
  v_old_password text;
  v_can_bypass boolean;
  v_supabase_url text := 'https://qkzjztarlmezwizlyigo.supabase.co';
  v_service_key text;
  v_request_id bigint;
  v_status int;
  v_content text;
  v_response jsonb;
BEGIN
  SELECT rolbypassrls INTO v_can_bypass FROM pg_roles WHERE rolname = session_user;

  IF coalesce(v_can_bypass, false) = false AND v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Bạn phải đăng nhập để thực hiện.';
  END IF;

  IF coalesce(v_can_bypass, false) = false AND NOT public.is_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên mới có quyền đổi mật khẩu.';
  END IF;

  IF p_new_password IS NULL OR length(p_new_password) < 6 THEN
    RAISE EXCEPTION 'Mật khẩu phải có ít nhất 6 ký tự.';
  END IF;

  -- Get service role key from vault
  SELECT decrypted_secret INTO v_service_key 
  FROM vault.decrypted_secrets 
  WHERE name = 'edge-function-service-key'
  LIMIT 1;

  IF v_service_key IS NULL THEN
    RAISE EXCEPTION 'Chưa cấu hình service role key trong vault.';
  END IF;

  -- Call edge function via pg_net (which calls Auth Admin API)
  v_request_id := net.http_post(
    url := v_supabase_url || '/functions/v1/admin-update-password',
    body := jsonb_build_object(
      'user_id', p_user_id,
      'new_password', p_new_password
    ),
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'X-Admin-Token', v_service_key
    ),
    timeout_milliseconds := 10000
  );

  -- Wait for response
  FOR i IN 1..200 LOOP
    SELECT status_code, content INTO v_status, v_content
    FROM net._http_response
    WHERE id = v_request_id;

    IF v_status IS NOT NULL THEN
      EXIT;
    END IF;

    PERFORM pg_sleep(0.05);
  END LOOP;

  IF v_status IS NULL THEN
    RAISE EXCEPTION 'Edge function không phản hồi sau 10 giây.';
  END IF;

  BEGIN
    v_response := v_content::jsonb;
  EXCEPTION WHEN OTHERS THEN
    RAISE EXCEPTION 'Edge function trả về phản hồi không hợp lệ: %', v_content;
  END;

  IF v_status >= 400 OR coalesce((v_response->>'success')::boolean, false) = false THEN
    RAISE EXCEPTION 'Đổi mật khẩu thất bại: %', coalesce(v_response->>'error', 'Lỗi không xác định (HTTP ' || v_status || ')');
  END IF;

  RETURN jsonb_build_object('success', true);
END;
$function$;

GRANT EXECUTE ON FUNCTION public.admin_update_user_password(uuid, text) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_update_user_password(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_update_user_password(uuid, text) FROM public;
