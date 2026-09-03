/*
# Bách Hoa Triều Phụng — Goddess Ranking System

1. New Tables
- `bach_hoa_entries` — contestant profiles for the Bách Hoa Triều Phụng goddess beauty contest.
  - `id` (uuid, primary key)
  - `identity_name` (text, not null) — display name / danh tính
  - `quote` (text) — trích dẫn / quote
  - `avatar_url` (text) — path to square avatar image
  - `vote_count` (integer, default 0) — total votes received
  - `created_at` (timestamptz, default now())
  - `updated_at` (timestamptz, default now())

2. New Functions
- `bach_hoa_vote(p_entry_id uuid)` — SECURITY DEFINER, callable by authenticated users.
  Increments vote_count by 1 for the given entry. Returns the new vote_count.
  One vote per user per entry (enforced via a separate vote log table to prevent duplicates).
- `admin_create_bach_hoa_entry(p_identity_name, p_quote, p_avatar_url)` — SECURITY DEFINER, admin-only.
  Inserts a new entry and returns the new row id.
- `admin_update_bach_hoa_entry(p_entry_id, p_identity_name, p_quote, p_avatar_url)` — SECURITY DEFINER, admin-only.
  Updates an existing entry's fields (only non-null parameters are applied).
- `admin_delete_bach_hoa_entry(p_entry_id)` — SECURITY DEFINER, admin-only.
  Deletes an entry and its associated votes.

3. New Tables (cont.)
- `bach_hoa_votes` — vote log to prevent duplicate voting.
  - `id` (uuid, primary key)
  - `entry_id` (uuid, references bach_hoa_entries, on delete cascade)
  - `user_id` (uuid, not null, default auth.uid())
  - `created_at` (timestamptz, default now())
  - UNIQUE constraint on (entry_id, user_id) — one vote per user per entry.

4. Security
- RLS enabled on both tables.
- `bach_hoa_entries`: SELECT is public (anon + authenticated) so anyone can view the ranking.
  INSERT/UPDATE/DELETE are admin-only (via is_admin() check).
- `bach_hoa_votes`: SELECT is public (to show who voted). INSERT is authenticated-only
  (the RPC handles the actual vote; direct inserts are blocked by RLS since user_id must match auth.uid()).
- All admin functions check is_admin() and are REVOKE'd from anon/PUBLIC, GRANT'd to authenticated.
- Realtime publication enabled for bach_hoa_entries so vote count changes propagate live.

5. Seed Data
- 5 female contestant profiles seeded with avatar images from /images/bach-hoa-trieu-phung/.
*/

-- Main entries table
CREATE TABLE IF NOT EXISTS public.bach_hoa_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identity_name text NOT NULL,
  quote text DEFAULT '',
  avatar_url text DEFAULT '',
  vote_count integer NOT NULL DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.bach_hoa_entries ENABLE ROW LEVEL SECURITY;

-- Public read
DROP POLICY IF EXISTS "bach_hoa_select_all" ON public.bach_hoa_entries;
CREATE POLICY "bach_hoa_select_all" ON public.bach_hoa_entries FOR SELECT
  TO anon, authenticated USING (true);

-- Admin insert
DROP POLICY IF EXISTS "bach_hoa_admin_insert" ON public.bach_hoa_entries;
CREATE POLICY "bach_hoa_admin_insert" ON public.bach_hoa_entries FOR INSERT
  TO authenticated WITH CHECK (public.is_admin());

-- Admin update
DROP POLICY IF EXISTS "bach_hoa_admin_update" ON public.bach_hoa_entries;
CREATE POLICY "bach_hoa_admin_update" ON public.bach_hoa_entries FOR UPDATE
  TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- Admin delete
DROP POLICY IF EXISTS "bach_hoa_admin_delete" ON public.bach_hoa_entries;
CREATE POLICY "bach_hoa_admin_delete" ON public.bach_hoa_entries FOR DELETE
  TO authenticated USING (public.is_admin());

-- Votes table (dedup)
CREATE TABLE IF NOT EXISTS public.bach_hoa_votes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_id uuid NOT NULL REFERENCES public.bach_hoa_entries(id) ON DELETE CASCADE,
  user_id uuid NOT NULL DEFAULT auth.uid(),
  created_at timestamptz DEFAULT now(),
  UNIQUE (entry_id, user_id)
);

ALTER TABLE public.bach_hoa_votes ENABLE ROW LEVEL SECURITY;

-- Public read (to show voter list if needed)
DROP POLICY IF EXISTS "bach_hoa_votes_select_all" ON public.bach_hoa_votes;
CREATE POLICY "bach_hoa_votes_select_all" ON public.bach_hoa_votes FOR SELECT
  TO anon, authenticated USING (true);

-- Authenticated can insert their own vote (the RPC uses this internally)
DROP POLICY IF EXISTS "bach_hoa_votes_insert_own" ON public.bach_hoa_votes;
CREATE POLICY "bach_hoa_votes_insert_own" ON public.bach_hoa_votes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

-- Vote RPC — atomic increment with dedup
CREATE OR REPLACE FUNCTION public.bach_hoa_vote(p_entry_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_count integer;
BEGIN
  -- Insert vote (fails on duplicate via UNIQUE constraint)
  INSERT INTO public.bach_hoa_votes (entry_id, user_id)
  VALUES (p_entry_id, auth.uid())
  ON CONFLICT (entry_id, user_id) DO NOTHING;

  -- Only increment if the vote was actually new
  IF FOUND THEN
    UPDATE public.bach_hoa_entries
      SET vote_count = vote_count + 1, updated_at = now()
      WHERE id = p_entry_id
      RETURNING vote_count INTO v_new_count;
  ELSE
    SELECT vote_count INTO v_new_count FROM public.bach_hoa_entries WHERE id = p_entry_id;
  END IF;

  RETURN v_new_count;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.bach_hoa_vote(p_entry_id uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.bach_hoa_vote(p_entry_id uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.bach_hoa_vote(p_entry_id uuid) TO authenticated;

-- Admin: create entry
CREATE OR REPLACE FUNCTION public.admin_create_bach_hoa_entry(
  p_identity_name text,
  p_quote text DEFAULT '',
  p_avatar_url text DEFAULT ''
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_id uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  INSERT INTO public.bach_hoa_entries (identity_name, quote, avatar_url)
  VALUES (p_identity_name, p_quote, p_avatar_url)
  RETURNING id INTO v_id;

  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_create_bach_hoa_entry(text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_create_bach_hoa_entry(text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_create_bach_hoa_entry(text, text, text) TO authenticated;

-- Admin: update entry
CREATE OR REPLACE FUNCTION public.admin_update_bach_hoa_entry(
  p_entry_id uuid,
  p_identity_name text DEFAULT NULL,
  p_quote text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE public.bach_hoa_entries SET
    identity_name = COALESCE(p_identity_name, identity_name),
    quote = COALESCE(p_quote, quote),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    updated_at = now()
  WHERE id = p_entry_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_update_bach_hoa_entry(uuid, text, text, text) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_update_bach_hoa_entry(uuid, text, text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_update_bach_hoa_entry(uuid, text, text, text) TO authenticated;

-- Admin: delete entry
CREATE OR REPLACE FUNCTION public.admin_delete_bach_hoa_entry(p_entry_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  DELETE FROM public.bach_hoa_entries WHERE id = p_entry_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_delete_bach_hoa_entry(uuid) FROM anon;
REVOKE EXECUTE ON FUNCTION public.admin_delete_bach_hoa_entry(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_delete_bach_hoa_entry(uuid) TO authenticated;

-- Enable realtime on bach_hoa_entries
ALTER PUBLICATION supabase_realtime ADD TABLE public.bach_hoa_entries;

-- Seed 5 female contestant profiles
INSERT INTO public.bach_hoa_entries (identity_name, quote, avatar_url) VALUES
  ('Lý Mộ Uyên', 'Hoa nở một thời, hương vương cõi mộng. Ta không cầu trường tồn, chỉ xin được nhớ.', '/images/bach-hoa-trieu-phung/Ly_Mo_Uyen.jpg'),
  ('Tô Vãn Tình', 'Nguyệt hạ độc hành, ảnh in vạn dặm. Ai nói cô độc không phải một thứ vũ khí?', '/images/bach-hoa-trieu-phung/image.png'),
  ('Cổ Tịch Nhan', 'Một nụ cười lật sát vạn binh. Ta không cần kiếm, ta chính là kiếm.', '/images/bach-hoa-trieu-phung/image copy.png'),
  ('Dung Tinh Vân', 'Mây che đỉnh núi không che được lòng. Ta đứng giữa gió, gió cũng phải lùi bước.', '/images/bach-hoa-trieu-phung/image copy 2.png'),
  ('Phong Tiêu Dao', 'Tiêu thanh xuyên mây, ai nghe cũng mộng. Ta không bắt ai yêu ta, ta chỉ khiến ai cũng nhớ.', '/images/bach-hoa-trieu-phung/tai_xuong_(32).jpg')
ON CONFLICT DO NOTHING;