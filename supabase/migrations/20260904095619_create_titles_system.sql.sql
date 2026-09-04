/*
# Create Titles (Bộ Sưu Tầm Danh Hiệu) System

## Overview
Adds a titles collection system. Admins create and manage a catalog of titles (danh hiệu),
assign them to players, and players can choose which of their owned titles to display on
their profile (maximum 3 simultaneously, or none at all).

## New Tables
1. `titles` — catalog of all available titles
   - `id` (uuid, PK)
   - `name` (text, not null) — display name of the title
   - `description` (text, nullable) — optional description
   - `color` (text, default 'amber') — color theme key for styling (amber, red, emerald, blue, purple, gray)
   - `created_at` (timestamptz, default now())

2. `user_titles` — junction table tracking which titles each user owns and displays
   - `id` (uuid, PK)
   - `user_id` (uuid, not null, FK to auth.users, ON DELETE CASCADE)
   - `title_id` (uuid, not null, FK to titles, ON DELETE CASCADE)
   - `is_displayed` (boolean, default false) — whether the user chose to display this title
   - `granted_by` (uuid, nullable, FK to auth.users) — admin who assigned the title
   - `granted_at` (timestamptz, default now())
   - UNIQUE constraint on (user_id, title_id) — a user can't have the same title twice

## Functions
1. `admin_add_title(p_name, p_description, p_color)` — admin-only, creates a new title
2. `admin_update_title(p_title_id, p_name, p_description, p_color)` — admin-only, updates a title
3. `admin_delete_title(p_title_id)` — admin-only, deletes a title (cascades to user_titles)
4. `admin_assign_title(p_user_id, p_title_id)` — admin-only, grants a title to a user
5. `admin_revoke_title(p_user_title_id)` — admin-only, removes a title from a user
6. `toggle_title_display(p_user_title_id, p_display)` — user-facing, toggles is_displayed;
   enforces maximum 3 displayed titles per user

## Security
- RLS enabled on both tables
- `titles`: anyone (anon, authenticated) can SELECT (titles are public catalog);
  only admins can INSERT/UPDATE/DELETE (enforced via is_admin() check in SECURITY DEFINER functions)
- `user_titles`: users can SELECT their own rows; admins can see all (for management);
  only admins can INSERT/DELETE (via SECURITY DEFINER functions);
  users can UPDATE is_displayed only on their own rows (via toggle_title_display function)
- All admin functions check `is_admin()` and return an error if the caller is not an admin
*/

-- ============================================================================
-- 1. Create titles table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.titles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  color text NOT NULL DEFAULT 'amber',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.titles ENABLE ROW LEVEL SECURITY;

-- Public read: anyone can see the titles catalog
DROP POLICY IF EXISTS "public_read_titles" ON public.titles;
CREATE POLICY "public_read_titles"
  ON public.titles FOR SELECT
  TO anon, authenticated USING (true);

-- No direct INSERT/UPDATE/DELETE policies — only via SECURITY DEFINER functions

-- ============================================================================
-- 2. Create user_titles table
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.user_titles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title_id uuid NOT NULL REFERENCES public.titles(id) ON DELETE CASCADE,
  is_displayed boolean NOT NULL DEFAULT false,
  granted_by uuid REFERENCES auth.users(id),
  granted_at timestamptz DEFAULT now(),
  UNIQUE (user_id, title_id)
);

ALTER TABLE public.user_titles ENABLE ROW LEVEL SECURITY;

-- Users can read their own titles; admins can read all
DROP POLICY IF EXISTS "select_own_user_titles" ON public.user_titles;
CREATE POLICY "select_own_user_titles"
  ON public.user_titles FOR SELECT
  TO authenticated USING (auth.uid() = user_id OR public.is_admin());

-- Users can update is_displayed on their own rows (toggle_title_display also enforces this)
DROP POLICY IF EXISTS "update_own_user_titles" ON public.user_titles;
CREATE POLICY "update_own_user_titles"
  ON public.user_titles FOR UPDATE
  TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- No direct INSERT/DELETE policies — only via SECURITY DEFINER functions

-- ============================================================================
-- 3. Admin functions for titles management
-- ============================================================================

-- Add a new title
CREATE OR REPLACE FUNCTION public.admin_add_title(
  p_name text,
  p_description text DEFAULT NULL,
  p_color text DEFAULT 'amber'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_id uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không có quyền');
  END IF;
  IF p_name IS NULL OR trim(p_name) = '' THEN
    RETURN jsonb_build_object('success', false, 'error', 'Tên danh hiệu không được để trống');
  END IF;

  INSERT INTO public.titles (name, description, color)
  VALUES (trim(p_name), p_description, p_color)
  RETURNING id INTO v_new_id;

  RETURN jsonb_build_object('success', true, 'title_id', v_new_id);
END;
$$;

-- Update an existing title
CREATE OR REPLACE FUNCTION public.admin_update_title(
  p_title_id uuid,
  p_name text DEFAULT NULL,
  p_description text DEFAULT NULL,
  p_color text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không có quyền');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.titles WHERE id = p_title_id) THEN
    RETURN jsonb_build_object('success', false, 'error', 'Danh hiệu không tồn tại');
  END IF;

  UPDATE public.titles SET
    name = COALESCE(NULLIF(trim(p_name), ''), name),
    description = COALESCE(p_description, description),
    color = COALESCE(NULLIF(trim(p_color), ''), color)
  WHERE id = p_title_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Delete a title
CREATE OR REPLACE FUNCTION public.admin_delete_title(p_title_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không có quyền');
  END IF;
  DELETE FROM public.titles WHERE id = p_title_id;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- Assign a title to a user
CREATE OR REPLACE FUNCTION public.admin_assign_title(
  p_user_id uuid,
  p_title_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_exists boolean;
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không có quyền');
  END IF;

  SELECT EXISTS(SELECT 1 FROM public.user_titles WHERE user_id = p_user_id AND title_id = p_title_id) INTO v_exists;
  IF v_exists THEN
    RETURN jsonb_build_object('success', false, 'error', 'Người chơi đã sở hữu danh hiệu này');
  END IF;

  INSERT INTO public.user_titles (user_id, title_id, granted_by)
  VALUES (p_user_id, p_title_id, auth.uid())
  ON CONFLICT (user_id, title_id) DO NOTHING;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Revoke a title from a user
CREATE OR REPLACE FUNCTION public.admin_revoke_title(p_user_title_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không có quyền');
  END IF;
  DELETE FROM public.user_titles WHERE id = p_user_title_id;
  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================================================
-- 4. User function: toggle title display (max 3 displayed)
-- ============================================================================

CREATE OR REPLACE FUNCTION public.toggle_title_display(
  p_user_title_id uuid,
  p_display boolean
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_current_displayed_count int;
BEGIN
  SELECT user_id INTO v_user_id FROM public.user_titles WHERE id = p_user_title_id;
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Danh hiệu không tồn tại');
  END IF;
  IF v_user_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Không có quyền');
  END IF;

  IF p_display THEN
    SELECT count(*) INTO v_current_displayed_count
    FROM public.user_titles
    WHERE user_id = v_user_id AND is_displayed = true;
    IF v_current_displayed_count >= 3 THEN
      RETURN jsonb_build_object('success', false, 'error', 'Chỉ được hiển thị tối đa 3 danh hiệu cùng lúc');
    END IF;
  END IF;

  UPDATE public.user_titles
  SET is_displayed = p_display
  WHERE id = p_user_title_id;

  RETURN jsonb_build_object('success', true);
END;
$$;

-- ============================================================================
-- 5. Grant execute permissions
-- ============================================================================
-- Admin functions: only authenticated (is_admin check inside)
GRANT EXECUTE ON FUNCTION public.admin_add_title(text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_title(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_title(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_assign_title(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_revoke_title(uuid) TO authenticated;

-- User function: authenticated users
GRANT EXECUTE ON FUNCTION public.toggle_title_display(uuid, boolean) TO authenticated;