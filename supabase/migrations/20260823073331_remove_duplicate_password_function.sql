-- Remove the old 2-arg version of admin_update_user_password (oid 18151)
-- Keep only the 3-arg version (oid 18465) which supports the edge function admin_id parameter
DROP FUNCTION IF EXISTS public.admin_update_user_password(uuid, text);