-- Add cup_type column to matches table for A/B tournament support
ALTER TABLE matches ADD COLUMN IF NOT EXISTS cup_type TEXT CHECK (cup_type IN ('A', 'B'));

-- Add index for cup matches
CREATE INDEX IF NOT EXISTS idx_matches_cup_type ON matches(tournament_id, cup_type) WHERE cup_type IS NOT NULL;
