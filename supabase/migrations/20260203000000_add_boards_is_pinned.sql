-- Add is_pinned column to boards table
-- This allows users to pin important boards for quick access

ALTER TABLE boards
ADD COLUMN IF NOT EXISTS is_pinned BOOLEAN NOT NULL DEFAULT FALSE;

-- Add index for faster filtering by pinned status
CREATE INDEX IF NOT EXISTS idx_boards_owner_pinned
ON boards(owner_id, is_pinned)
WHERE is_pinned = TRUE;

-- Comment for documentation
COMMENT ON COLUMN boards.is_pinned IS 'Whether the board is pinned for quick access';
