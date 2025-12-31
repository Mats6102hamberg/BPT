-- Add court_number column to matches table
-- Run this in Neon SQL Editor

ALTER TABLE matches ADD COLUMN IF NOT EXISTS court_number TEXT;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_matches_court_number ON matches(tournament_id, court_number) WHERE court_number IS NOT NULL;
