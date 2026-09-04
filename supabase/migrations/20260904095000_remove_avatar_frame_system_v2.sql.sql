/*
# Remove Avatar Frame System

## Overview
Reverts the avatar frame system that was recreated in the bulk admin features migration.
The broadcast notification and bulk currency grant features remain untouched.

## Changes
1. Drop functions: purchase_avatar_frame, equip_avatar_frame, unequip_avatar_frame, admin_bulk_grant_avatar_frame
2. Drop table: user_avatar_frames (RLS policies auto-dropped)
3. Drop table: avatar_frames CASCADE (drops FK on profiles)
4. Remove active_frame_id column from profiles
5. Remove replica identity settings
*/

-- Drop functions
DROP FUNCTION IF EXISTS public.purchase_avatar_frame(uuid);
DROP FUNCTION IF EXISTS public.equip_avatar_frame(uuid);
DROP FUNCTION IF EXISTS public.unequip_avatar_frame();
DROP FUNCTION IF EXISTS public.admin_bulk_grant_avatar_frame(uuid);

-- Drop user_avatar_frames table (RLS policies auto-dropped)
DROP TABLE IF EXISTS public.user_avatar_frames;

-- Drop avatar_frames table with CASCADE (drops FK constraint on profiles)
DROP TABLE IF EXISTS public.avatar_frames CASCADE;

-- Remove active_frame_id column from profiles
ALTER TABLE public.profiles DROP COLUMN IF EXISTS active_frame_id;