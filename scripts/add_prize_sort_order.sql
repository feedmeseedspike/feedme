-- Run this in your Supabase SQL Editor to enable prize reordering
ALTER TABLE spin_prizes ADD COLUMN IF NOT EXISTS sort_order INT DEFAULT 0;

-- Optional: Initial order based on current created_at
WITH ordered_prizes AS (
    SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) - 1 as new_order
    FROM spin_prizes
)
UPDATE spin_prizes
SET sort_order = ordered_prizes.new_order
FROM ordered_prizes
WHERE spin_prizes.id = ordered_prizes.id;

NOTIFY pgrst, 'reload config';
