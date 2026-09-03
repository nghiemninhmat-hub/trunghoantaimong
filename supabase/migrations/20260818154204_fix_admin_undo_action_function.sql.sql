/*
# Fix admin_undo_action: remove invalid line, fix typo

## Changes
- Removes an invalid dummy UPDATE line in the update_status branch
- Fixes a Vietnamese typo ("Đà" → "Đã") in the edit_transaction branch
- Otherwise identical to the previous version
*/
CREATE OR REPLACE FUNCTION public.admin_undo_action(p_audit_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_admin_id uuid := auth.uid();
  v_log public.admin_audit_log%ROWTYPE;
  v_details jsonb;
  v_current int;
  v_new_balance int;
  v_col text;
  v_old_amount int;
  v_old_currency text;
  v_old_reason text;
  v_old_related text;
  v_old_danh_vong text;
  v_old_status text;
  v_field text;
  v_item_id uuid;
  v_kim_bang_id text;
  v_old_value text;
  v_result jsonb;
BEGIN
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Bạn phải đăng nhập để thực hiện.';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên mới có quyền khôi phục thao tác.';
  END IF;

  SELECT * INTO v_log FROM public.admin_audit_log WHERE id = p_audit_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy nhật ký thao tác.';
  END IF;

  v_details := COALESCE(v_log.details, '{}'::jsonb);

  CASE v_log.action
    WHEN 'adjust_currency' THEN
      v_old_amount := (v_details->>'amount')::int;
      v_old_currency := v_details->>'currency_type';
      IF v_old_currency = 'HUA_TIEN' THEN v_col := 'hua_tien';
      ELSIF v_old_currency = 'CONG_DUC' THEN v_col := 'cong_duc';
      ELSIF v_old_currency = 'AM_DUC' THEN v_col := 'am_duc';
      ELSE RAISE EXCEPTION 'Loại tiền không hợp lệ.';
      END IF;
      EXECUTE format('SELECT %I FROM public.profiles WHERE id = $1', v_col)
        INTO v_current USING v_log.target_user_id;
      v_new_balance := v_current - v_old_amount;
      IF v_new_balance < 0 THEN v_new_balance := 0; END IF;
      EXECUTE format('UPDATE public.profiles SET %I = $1 WHERE id = $2', v_col)
        USING v_new_balance, v_log.target_user_id;
      INSERT INTO public.transactions (user_id, amount, currency_type, reason)
      VALUES (v_log.target_user_id, -v_old_amount, v_old_currency, '[QTV] Hoàn tác điều chỉnh tài sản');
      v_result := jsonb_build_object('success', true, 'description', 'Đã hoàn tác điều chỉnh ' || v_old_amount || ' ' || v_old_currency);

    WHEN 'revoke_asset' THEN
      v_old_amount := (v_details->>'amount')::int;
      v_old_currency := v_details->>'currency_type';
      IF v_old_currency IS NOT NULL AND v_old_currency IN ('HUA_TIEN', 'CONG_DUC', 'AM_DUC') AND v_old_amount > 0 THEN
        IF v_old_currency = 'HUA_TIEN' THEN v_col := 'hua_tien';
        ELSIF v_old_currency = 'CONG_DUC' THEN v_col := 'cong_duc';
        ELSIF v_old_currency = 'AM_DUC' THEN v_col := 'am_duc';
        END IF;
        EXECUTE format('SELECT %I FROM public.profiles WHERE id = $1', v_col)
          INTO v_current USING v_log.target_user_id;
        v_new_balance := v_current + v_old_amount;
        EXECUTE format('UPDATE public.profiles SET %I = $1 WHERE id = $2', v_col)
          USING v_new_balance, v_log.target_user_id;
        INSERT INTO public.transactions (user_id, amount, currency_type, reason)
        VALUES (v_log.target_user_id, v_old_amount, v_old_currency, '[QTV] Hoàn tác thu hồi tài sản');
      END IF;
      v_result := jsonb_build_object('success', true, 'description', 'Đã hoàn trả ' || v_old_amount || ' ' || v_old_currency || ' cho người chơi');

    WHEN 'add_transaction' THEN
      v_old_amount := (v_details->>'amount')::int;
      v_old_currency := v_details->>'currency_type';
      IF v_old_currency = 'HUA_TIEN' THEN v_col := 'hua_tien';
      ELSIF v_old_currency = 'CONG_DUC' THEN v_col := 'cong_duc';
      ELSIF v_old_currency = 'AM_DUC' THEN v_col := 'am_duc';
      END IF;
      EXECUTE format('SELECT %I FROM public.profiles WHERE id = $1', v_col)
        INTO v_current USING v_log.target_user_id;
      v_new_balance := v_current - v_old_amount;
      IF v_new_balance < 0 THEN v_new_balance := 0; END IF;
      EXECUTE format('UPDATE public.profiles SET %I = $1 WHERE id = $2', v_col)
        USING v_new_balance, v_log.target_user_id;
      DELETE FROM public.transactions
      WHERE user_id = v_log.target_user_id
        AND amount = v_old_amount
        AND currency_type = v_old_currency
        AND reason = v_details->>'reason'
        AND id = (
          SELECT id FROM public.transactions
          WHERE user_id = v_log.target_user_id
            AND amount = v_old_amount
            AND currency_type = v_old_currency
            AND reason = v_details->>'reason'
          ORDER BY created_at DESC
          LIMIT 1
        );
      v_result := jsonb_build_object('success', true, 'description', 'Đã xóa giao dịch và hoàn số dư');

    WHEN 'edit_transaction' THEN
      IF v_details ? 'previous_values' THEN
        v_old_amount := (v_details->'previous_values'->>'amount')::int;
        v_old_currency := v_details->'previous_values'->>'currency_type';
        v_old_reason := v_details->'previous_values'->>'reason';
        v_old_related := v_details->'previous_values'->>'related_user_name';
      ELSE
        RAISE EXCEPTION 'Không đủ dữ liệu để khôi phục giao dịch đã sửa.';
      END IF;
      PERFORM public.admin_edit_transaction(
        (v_details->>'tx_id')::uuid,
        v_old_amount,
        v_old_currency,
        v_old_reason,
        v_old_related
      );
      v_result := jsonb_build_object('success', true, 'description', 'Đã khôi phục giao dịch về giá trị cũ');

    WHEN 'delete_transaction' THEN
      RAISE EXCEPTION 'Không thể khôi phục giao dịch đã xóa (dữ liệu đã bị xóa vĩnh viễn).';

    WHEN 'grant_inventory_item' THEN
      v_item_id := (v_details->>'item_id')::uuid;
      DELETE FROM public.inventories
      WHERE user_id = v_log.target_user_id
        AND item_id = v_item_id
        AND id = (
          SELECT id FROM public.inventories
          WHERE user_id = v_log.target_user_id
            AND item_id = v_item_id
          ORDER BY acquired_at DESC
          LIMIT 1
        );
      v_result := jsonb_build_object('success', true, 'description', 'Đã xóa vật phẩm đã cấp');

    WHEN 'revoke_inventory_item' THEN
      RAISE EXCEPTION 'Không thể khôi phục vật phẩm đã thu hồi (dữ liệu đã bị xóa).';

    WHEN 'edit_shop_item' THEN
      IF v_details ? 'previous_values' THEN
        UPDATE public.shop_items SET
          name = v_details->'previous_values'->>'name',
          category = v_details->'previous_values'->>'category',
          price = (v_details->'previous_values'->>'price')::int,
          currency_type = v_details->'previous_values'->>'currency_type',
          stock = (v_details->'previous_values'->>'stock')::int,
          description = v_details->'previous_values'->>'description',
          shop_area = v_details->'previous_values'->>'shop_area',
          purchase_limit = v_details->'previous_values'->>'purchase_limit'
        WHERE id = (v_details->>'item_id')::uuid;
        v_result := jsonb_build_object('success', true, 'description', 'Đã khôi phục vật phẩm về giá trị cũ');
      ELSE
        RAISE EXCEPTION 'Không đủ dữ liệu để khôi phục vật phẩm đã sửa.';
      END IF;

    WHEN 'add_shop_item' THEN
      DELETE FROM public.shop_items
      WHERE name = v_details->>'name'
        AND id = (
          SELECT id FROM public.shop_items
          WHERE name = v_details->>'name'
          ORDER BY created_at DESC
          LIMIT 1
        );
      v_result := jsonb_build_object('success', true, 'description', 'Đã xóa vật phẩm đã thêm');

    WHEN 'delete_shop_item' THEN
      RAISE EXCEPTION 'Không thể khôi phục vật phẩm đã xóa (dữ liệu đã bị xóa vĩnh viễn).';

    WHEN 'set_danh_vong' THEN
      v_old_danh_vong := v_details->'previous_values'->>'danh_vong';
      IF v_old_danh_vong IS NULL THEN
        v_old_danh_vong := 'Vô Danh';
      END IF;
      UPDATE public.profiles SET danh_vong = v_old_danh_vong WHERE id = v_log.target_user_id;
      v_result := jsonb_build_object('success', true, 'description', 'Đã khôi phục danh vọng về "' || v_old_danh_vong || '"');

    WHEN 'update_status' THEN
      v_old_status := v_details->'previous_values'->>'value';
      v_field := v_details->>'field';
      IF v_field IS NOT NULL AND v_old_status IS NOT NULL THEN
        EXECUTE format('UPDATE public.profiles SET %I = $1 WHERE id = $2', v_field)
          USING v_old_status, v_log.target_user_id;
        v_result := jsonb_build_object('success', true, 'description', 'Đã khôi phục trạng thái');
      ELSE
        RAISE EXCEPTION 'Không đủ dữ liệu để khôi phục trạng thái.';
      END IF;

    WHEN 'update_kim_bang' THEN
      v_kim_bang_id := v_details->>'kim_bang_id';
      v_field := v_details->>'field';
      v_old_value := v_details->'previous_values'->>'value';
      IF v_kim_bang_id IS NOT NULL AND v_field IS NOT NULL AND v_old_value IS NOT NULL THEN
        EXECUTE format('UPDATE public.kim_bang SET %I = $1, updated_at = now() WHERE id = $2', v_field)
          USING v_old_value, v_kim_bang_id;
        v_result := jsonb_build_object('success', true, 'description', 'Đã khôi phục Kim Bảng');
      ELSE
        RAISE EXCEPTION 'Không đủ dữ liệu để khôi phục Kim Bảng.';
      END IF;

    ELSE
      RAISE EXCEPTION 'Thao tác "%" không hỗ trợ khôi phục.', v_log.action;
  END CASE;

  INSERT INTO public.admin_audit_log (admin_id, admin_email, action, target_user_id, target_description, details)
  SELECT
    v_admin_id,
    p.email,
    'undo_action',
    v_log.target_user_id,
    'Khôi phục: ' || v_log.target_description,
    jsonb_build_object('original_audit_id', p_audit_id, 'original_action', v_log.action, 'result', v_result)
  FROM public.profiles p
  WHERE p.id = v_admin_id;

  RETURN v_result;
END;
$function$;
