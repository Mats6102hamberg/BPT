-- Boule Pro Tävlingar Database Schema for Vercel Postgres

-- Tournaments table
CREATE TABLE IF NOT EXISTS tournaments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  date TEXT NOT NULL,
  settings JSONB NOT NULL,
  current_phase TEXT NOT NULL,
  current_round INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  players JSONB NOT NULL,
  contact_info TEXT,
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  points INTEGER DEFAULT 0,
  buchholz INTEGER DEFAULT 0,
  opponents JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Matches table
CREATE TABLE IF NOT EXISTS matches (
  id TEXT PRIMARY KEY,
  tournament_id TEXT NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  team1_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  team2_id TEXT NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  team1_score INTEGER,
  team2_score INTEGER,
  is_completed BOOLEAN DEFAULT FALSE,
  winner_id TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Announcements table
CREATE TABLE IF NOT EXISTS announcements (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  tournament_id TEXT REFERENCES tournaments(id) ON DELETE CASCADE,
  tournament_name TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('normal', 'important', 'urgent')),
  created_at BIGINT NOT NULL,
  read_by JSONB DEFAULT '[]'::jsonb
);

-- Indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teams_tournament ON teams(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_tournament ON matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_matches_round ON matches(tournament_id, round);
CREATE INDEX IF NOT EXISTS idx_announcements_tournament ON announcements(tournament_id);
CREATE INDEX IF NOT EXISTS idx_announcements_created ON announcements(created_at DESC);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for tournaments updated_at
CREATE TRIGGER update_tournaments_updated_at
  BEFORE UPDATE ON tournaments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
