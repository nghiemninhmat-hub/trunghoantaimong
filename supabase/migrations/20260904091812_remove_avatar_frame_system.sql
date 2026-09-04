-- Drop avatar frame functions
DROP FUNCTION IF EXISTS purchase_avatar_frame(text);
DROP FUNCTION IF EXISTS equip_avatar_frame(text);
DROP FUNCTION IF EXISTS unequip_avatar_frame();

-- Drop user_avatar_frames table (RLS policies auto-dropped)
DROP TABLE IF EXISTS user_avatar_frames;

-- Drop avatar_frames table with CASCADE (drops the foreign key constraint on profiles automatically)
DROP TABLE IF EXISTS avatar_frames CASCADE;

-- Remove active_frame_id column from profiles (the FK constraint was already dropped by CASCADE)
ALTER TABLE profiles DROP COLUMN IF EXISTS active_frame_id;
