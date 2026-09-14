-- Make transfer_hua_tien recipient matching case-insensitive
-- Previously used exact case-sensitive match (oc_name = p_recipient_name)
-- Now uses ILIKE for case-insensitive exact match

DROP FUNCTION IF EXISTS public.transfer_hua_tien(text, integer, text);

CREATE FUNCTION public.transfer_hua_tien(
  p_recipient_name text,
  p_amount integer,
  p_reason text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender_id uuid := auth.uid();
  v_sender_name text;
  v_recipient_id uuid;
  v_recipient_name text;
  v_sender_balance int;
BEGIN
  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Số tiền chuyển phải lớn hơn 0';
  END IF;

  IF p_reason IS NULL OR btrim(p_reason) = '' THEN
    RAISE EXCEPTION 'Vui lòng nhập lý do chuyển khoản';
  END IF;

  -- Get sender info
  SELECT id, oc_name, hua_tien INTO v_sender_id, v_sender_name, v_sender_balance
    FROM public.profiles WHERE id = v_sender_id;

  IF v_sender_id IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy hồ sơ người gửi';
  END IF;

  IF v_sender_balance IS NULL OR v_sender_balance < p_amount THEN
    RAISE EXCEPTION 'Không đủ Hoa Tiền để chuyển (số dư: %)', v_sender_balance;
  END IF;

  -- Find recipient by OC name (case-insensitive exact match)
  SELECT id, oc_name INTO v_recipient_id, v_recipient_name
    FROM public.profiles
    WHERE oc_name ILIKE p_recipient_name AND is_approved = true;

  IF v_recipient_id IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy người nhận "%"', p_recipient_name;
  END IF;

  IF v_recipient_id = v_sender_id THEN
    RAISE EXCEPTION 'Không thể chuyển cho chính mình';
  END IF;

  -- Deduct from sender
  UPDATE public.profiles
    SET hua_tien = hua_tien - p_amount
    WHERE id = v_sender_id;

  -- Add to recipient
  UPDATE public.profiles
    SET hua_tien = hua_tien + p_amount
    WHERE id = v_recipient_id;

  -- Log sender transaction (negative)
  INSERT INTO public.transactions (user_id, amount, currency_type, reason, related_user_name)
    VALUES (v_sender_id, -p_amount, 'HUA_TIEN', 'Chuyển khoản: ' || btrim(p_reason), v_recipient_name);

  -- Log recipient transaction (positive)
  INSERT INTO public.transactions (user_id, amount, currency_type, reason, related_user_name)
    VALUES (v_recipient_id, p_amount, 'HUA_TIEN', 'Nhận chuyển khoản: ' || btrim(p_reason), v_sender_name);

  RETURN jsonb_build_object(
    'success', true,
    'recipient_name', v_recipient_name,
    'amount', p_amount
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION public.transfer_hua_tien(text, integer, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.transfer_hua_tien(text, integer, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transfer_hua_tien(text, integer, text) TO authenticated;
