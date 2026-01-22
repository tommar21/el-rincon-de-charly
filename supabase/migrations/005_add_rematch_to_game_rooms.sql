-- Add rematch_requested_by column to game_rooms table
-- This column stores the user_id of the player who requested a rematch

ALTER TABLE game_rooms
ADD COLUMN IF NOT EXISTS rematch_requested_by uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_game_rooms_rematch_requested_by ON game_rooms(rematch_requested_by);

-- Comment for documentation
COMMENT ON COLUMN game_rooms.rematch_requested_by IS 'The user_id of the player who requested a rematch. NULL means no rematch requested.';
