-- V8: Wipe all rating tables and football players for clean re-seed.
-- Rating tables are empty but truncate for safety.

-- Truncate rating tables (dependency order)
TRUNCATE TABLE nomination_support CASCADE;
TRUNCATE TABLE nomination CASCADE;
TRUNCATE TABLE elo_matchup CASCADE;
TRUNCATE TABLE ranking_history CASCADE;
TRUNCATE TABLE rating_day CASCADE;

-- Delete football AI analysis (references players)
DELETE FROM ai_analysis WHERE player_id IN (
    SELECT id FROM players WHERE sport = 'FOOTBALL'
);

-- Delete football players
DELETE FROM players WHERE sport = 'FOOTBALL';
