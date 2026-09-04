/*
# Log inventory revocation as a transaction

## Purpose
When an admin revokes a single item from a player's inventory, the item is removed
from the inventories table AND a transaction record is inserted to create a visible
audit trail in the player's transaction history. The original purchase transaction
is NOT deleted or modified — only a new `[QTV] Thu hồi vật phẩm` record is added.

## New Function
- `admin_revoke_inventory_item(p_inv_id uuid, p_reason text)` → jsonb
  - Looks up the inventory row and item name
  - Deletes the inventory row
  - Inserts a transaction with reason `[QTV] Thu hồi vật phẩm: <name>` and amount 0
    (amount 0 so it does NOT affect the player's currency balance — this is purely
    an audit log entry, the currency spent on the original purchase is NOT refunded)
  - Sends a notification to the player
  - Returns the item name and user_id

## Security
- SECURITY DEFINER, search_path = 'public'
- Checks is_admin() before executing
- Requires authenticated session

## Notes
- Does NOT delete or modify any existing transaction rows
- Does NOT refund currency — the original purchase transaction remains as-is
- The amount=0 transaction is purely a visible audit record
- Sends a notification to the affected player
*/

CREATE OR REPLACE FUNCTION public.admin_revoke_inventory_item(
  p_inv_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_admin_id uuid := auth.uid();
  v_inv record;
  v_item_name text;
  v_final_reason text;
BEGIN
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Bạn phải đăng nhập để thực hiện.';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên mới có quyền thu hồi vật phẩm.';
  END IF;

  SELECT inv.user_id, inv.item_id, si.name
  INTO v_inv
  FROM public.inventories inv
  JOIN public.shop_items si ON si.id = inv.item_id
  WHERE inv.id = p_inv_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không tìm thấy vật phẩm trong kho.';
  END IF;

  v_item_name := v_inv.name;

  -- Delete the inventory item
  DELETE FROM public.inventories WHERE id = p_inv_id;

  -- Log a transaction record (amount=0, purely audit — no currency change)
  v_final_reason := '[QTV] Thu hồi vật phẩm: ' || v_item_name;
  IF p_reason IS NOT NULL AND btrim(p_reason) <> '' THEN
    v_final_reason := v_final_reason || ' — ' || btrim(p_reason);
  END IF;

  INSERT INTO public.transactions (user_id, amount, currency_type, reason)
  VALUES (v_inv.user_id, 0, 'HUA_TIEN', v_final_reason);

  -- Notify the player
  INSERT INTO public.notifications (recipient_id, type, title, body)
  VALUES (
    v_inv.user_id,
    'asset_revoked',
    'Vật phẩm bị thu hồi',
    'Vật phẩm "' || v_item_name || '" đã bị quản trị viên thu hồi.' ||
    CASE WHEN p_reason IS NOT NULL AND btrim(p_reason) <> '' THEN ' Lý do: ' || btrim(p_reason) ELSE '' END
  );

  RETURN jsonb_build_object(
    'success', true,
    'item_name', v_item_name,
    'user_id', v_inv.user_id
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.admin_revoke_inventory_item(uuid, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_revoke_inventory_item(uuid, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_revoke_inventory_item(uuid, text) TO authenticated;
