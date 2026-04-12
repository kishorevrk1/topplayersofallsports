-- V7: ELO and rating day tables now created in V1. This migration is a no-op kept for schema history continuity.
-- elo_score column, rating_day, elo_matchup, nomination, nomination_support, ranking_history
-- all created in V1 with IF NOT EXISTS guards.
-- The UPDATE below backfills elo_score for any already-seeded players (V2 football).
UPDATE players
SET elo_score = 1800 - ((current_rank - 1) * 6.06)
WHERE current_rank IS NOT NULL
  AND current_rank BETWEEN 1 AND 100
  AND (elo_score IS NULL OR elo_score = 1500);
