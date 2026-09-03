/*
# Soft-delete notifications for players

1. Overview
- Currently, when a player deletes a notification, the row is permanently removed from the database.
- This migration adds a `deleted_by_user` boolean column (default false) to the notifications table.
- Players "delete" by setting this flag to true (soft delete); the row remains in the database.
- Admins can still see all notifications regardless of the deleted_by_user flag.
- The SELECT policy is updated so players only see notifications where deleted_by_user = false.
- The UPDATE policy is updated so players can set deleted_by_user = true on their own notifications.
- The DELETE policy is revoked from players (only admins can hard-delete broadcast notifications).

2. New column on `notifications`
- `deleted_by_user` boolean NOT NULL DEFAULT false — when true, the notification is hidden from the player but still stored.

3. Security changes
- SELECT policy: players see their own notifications where deleted_by_user = false; admins see all broadcasts.
- UPDATE policy: players can update their own notifications (including setting deleted_by_user); admins can update broadcasts.
- DELETE policy: only admins can delete broadcast notifications (recipient_id IS NULL). Players can no longer hard-delete.
*/

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS deleted_by_user boolean NOT NULL DEFAULT false;

-- SELECT: players see only non-deleted own notifications; admins see all broadcasts
DROP POLICY IF EXISTS "select_own_notifications" ON notifications;
CREATE POLICY "select_own_notifications" ON notifications FOR SELECT
  TO authenticated USING (
    (recipient_id = auth.uid() AND deleted_by_user = false)
    OR (recipient_id IS NULL AND is_admin())
  );

-- UPDATE: players can soft-delete/mark-read their own; admins can update broadcasts
DROP POLICY IF EXISTS "update_own_notifications" ON notifications;
CREATE POLICY "update_own_notifications" ON notifications FOR UPDATE
  TO authenticated
  USING (recipient_id = auth.uid() OR (recipient_id IS NULL AND is_admin()))
  WITH CHECK (recipient_id = auth.uid() OR (recipient_id IS NULL AND is_admin()));

-- DELETE: only admins can hard-delete broadcast notifications
DROP POLICY IF EXISTS "delete_own_notifications" ON notifications;
CREATE POLICY "delete_own_notifications" ON notifications FOR DELETE
  TO authenticated USING (recipient_id IS NULL AND is_admin());
