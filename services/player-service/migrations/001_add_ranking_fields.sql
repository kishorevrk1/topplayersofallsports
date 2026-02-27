-- Migration: Add Top 50 Ranking Fields
-- Date: 2025-12-03
-- Description: Adds ranking-related fields to support dynamic top 50 player management

-- Add new columns for ranking system
ALTER TABLE players ADD COLUMN IF NOT EXISTS current_rank INTEGER;
ALTER TABLE players ADD COLUMN IF NOT EXISTS previous_rank INTEGER;
ALTER TABLE players ADD COLUMN IF NOT EXISTS ranking_score DOUBLE PRECISION;
ALTER TABLE players ADD COLUMN IF NOT EXISTS last_ranking_update TIMESTAMP;
ALTER TABLE players ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE players ADD COLUMN IF NOT EXISTS performance_summary TEXT;

-- Add indexes for efficient ranking queries
CREATE INDEX IF NOT EXISTS idx_player_ranking ON players(sport, current_rank);
CREATE INDEX IF NOT EXISTS idx_player_active ON players(sport, is_active, current_rank);

-- Update existing players to be marked as active
UPDATE players SET is_active = true WHERE is_active IS NULL;

-- Add comments for documentation
COMMENT ON COLUMN players.current_rank IS 'Current position in top 50 (1-50), NULL if not ranked';
COMMENT ON COLUMN players.previous_rank IS 'Previous rank for tracking movement';
COMMENT ON COLUMN players.ranking_score IS 'AI-calculated performance score (0-100)';
COMMENT ON COLUMN players.last_ranking_update IS 'Timestamp of last ranking update';
COMMENT ON COLUMN players.is_active IS 'Whether player is still actively competing';
COMMENT ON COLUMN players.performance_summary IS 'JSON or text summary of recent performance';

-- Verify migration
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'players' 
AND column_name IN ('current_rank', 'previous_rank', 'ranking_score', 'last_ranking_update', 'is_active', 'performance_summary')
ORDER BY ordinal_position;
