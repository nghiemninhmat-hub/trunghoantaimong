/*
# Admin grant inventory item with notification and transaction log

## Purpose
When an admin grants an inventory item to a player, three things must happen
atomically:
1. Insert the item into the player's inventory (inventories table).
2. Log a transaction record (amount=0, reason="[QTV] Cấp vật phẩm: <name>")
   so it appears in the player's transaction history on their profile page.
3. Send a notification to the player so they see the bell badge and message.

Previously, handleGrantInventoryItem in the frontend only did step 1 — the
player received the item but had no notification and no transaction history
entry. This function makes the grant visible to the player.

## New Function
- `admin_grant_inventory_item(p_user_id, p_item_id)` → jsonb
  - SECURITY DEFINER, search_path = 'public'
  - Checks is_admin() before executing
  - Inserts inventory row
  - Inserts transaction row with amount=0 and item name in reason
  - Inserts notification for the player
  - Returns success + item name

## Security
- SECURITY DEFINER with search_path locked to 'public'
- is_admin() check — only admins can call
- Revoke execute from anon/public, grant to authenticated only
*/

CREATE OR REPLACE FUNCTION public.admin_grant_inventory_item(
  p_user_id uuid,
  p_item_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_admin_id uuid := auth.uid();
  v_item_name text;
  v_notif_body text;
BEGIN
  IF v_admin_id IS NULL THEN
    RAISE EXCEPTION 'Bạn phải đăng nhập để thực hiện.';
  END IF;

  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Chỉ quản trị viên mới có quyền cấp vật phẩm.';
  END IF;

  SELECT name INTO v_item_name FROM public.shop_items WHERE id = p_item_id;
  IF v_item_name IS NULL THEN
    RAISE EXCEPTION 'Không tìm thấy vật phẩm.';
  END IF;

  INSERT INTO public.inventories (user_id, item_id)
  VALUES (p_user_id, p_item_id);

  INSERT INTO public.transactions (user_id, amount, currency_type, reason)
  VALUES (p_user_id, 0, NULL, '[QTV] Cấp vật phẩm: ' || v_item_name);

  v_notif_body := 'Quản trị viên đã cấp cho bạn vật phẩm: ' || v_item_name;
  INSERT INTO public.notifications (recipient_id, type, title, body, link)
  VALUES (p_user_id, 'item_granted', 'Nhận vật phẩm mới', v_notif_body, '/profile');

  RETURN jsonb_build_object(
    'success', true,
    'item_name', v_item_name
  );
END;
$function$;

GRANT EXECUTE ON FUNCTION public.admin_grant_inventory_item(uuid, uuid) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.admin_grant_inventory_item(uuid, uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_grant_inventory_item(uuid, uuid) FROM public;