/*
# Bách Hoa: titles, multi-vote with fee, admin-only voter list

1. Changes
- Add `title` column to bach_hoa_entries (admin-set custom title per entry)
- Drop UNIQUE constraint on (entry_id, user_id) so one account can vote multiple times
- Rewrite `bach_hoa_vote` to charge 10 hua_tien per vote, atomically deducting balance
- Update `admin_update_bach_hoa_entry` to accept p_title parameter
- Update `admin_create_bach_hoa_entry` to accept p_title parameter
- Drop the public SELECT policy on bach_hoa_votes; replace with admin-only SELECT
  so only admins can see who voted for whom

2. Security
- bach_hoa_votes SELECT is now admin-only (was public). INSERT stays auth.uid() = user_id.
- The vote function uses SECURITY DEFINER to atomically deduct hua_tien and insert the vote.
- No data loss: existing votes and entries are preserved.
*/

-- 1. Add title column
ALTER TABLE public.bach_hoa_entries
  ADD COLUMN IF NOT EXISTS title text DEFAULT '';

-- 2. Drop unique constraint allowing multiple votes per user
ALTER TABLE public.bach_hoa_votes
  DROP CONSTRAINT IF EXISTS bach_hoa_votes_entry_id_user_id_key;

-- 3. Drop public SELECT policy on votes, add admin-only SELECT
DROP POLICY IF EXISTS bach_hoa_votes_select_all ON public.bach_hoa_votes;

CREATE POLICY bach_hoa_votes_select_admin ON public.bach_hoa_votes
  FOR SELECT TO authenticated USING (public.is_admin());

-- 4. Drop old vote function (return type changed from integer to TABLE)
DROP FUNCTION IF EXISTS public.bach_hoa_vote(uuid);

-- 5. Create new vote function: charge 10 hua_tien per vote
CREATE OR REPLACE FUNCTION public.bach_hoa_vote(p_entry_id uuid)
RETURNS TABLE(new_vote_count integer, new_balance integer)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_new_count integer;
  v_balance integer;
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Vui lòng đăng nhập để bình chọn';
  END IF;

  -- Atomically deduct 10 hua_tien; abort if insufficient balance
  UPDATE public.profiles
  SET hua_tien = hua_tien - 10
  WHERE id = v_user_id AND hua_tien >= 10
  RETURNING hua_tien INTO v_balance;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Không đủ 10 hoa tiền để bình chọn';
  END IF;

  -- Insert the vote
  INSERT INTO public.bach_hoa_votes (entry_id, user_id)
  VALUES (p_entry_id, v_user_id);

  -- Increment vote count
  UPDATE public.bach_hoa_entries
  SET vote_count = vote_count + 1, updated_at = now()
  WHERE id = p_entry_id
  RETURNING vote_count INTO v_new_count;

  -- Log transaction
  INSERT INTO public.transactions (user_id, type, amount, description)
  VALUES (v_user_id, 'spend', -10, 'Bình chọn Bách Hoa Triều Phụng');

  RETURN QUERY SELECT v_new_count, v_balance;
END;
$function$;

-- 6. Update admin_update function to accept title
CREATE OR REPLACE FUNCTION public.admin_update_bach_hoa_entry(
  p_entry_id uuid,
  p_identity_name text DEFAULT NULL,
  p_quote text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL,
  p_title text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
IF NOT public.is_admin() THEN
RAISE EXCEPTION 'Not authorized';
END IF;

UPDATE public.bach_hoa_entries SET
  identity_name = COALESCE(p_identity_name, identity_name),
  quote = COALESCE(p_quote, quote),
  avatar_url = COALESCE(p_avatar_url, avatar_url),
  title = COALESCE(p_title, title),
  updated_at = now()
WHERE id = p_entry_id;
END;
$function$;

-- 7. Update admin_create function to accept title
CREATE OR REPLACE FUNCTION public.admin_create_bach_hoa_entry(
  p_identity_name text,
  p_quote text DEFAULT '',
  p_avatar_url text DEFAULT '',
  p_title text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
v_id uuid;
BEGIN
IF NOT public.is_admin() THEN
RAISE EXCEPTION 'Not authorized';
END IF;

INSERT INTO public.bach_hoa_entries (identity_name, quote, avatar_url, title)
VALUES (p_identity_name, p_quote, p_avatar_url, p_title)
RETURNING id INTO v_id;

RETURN v_id;
END;
$function$;
