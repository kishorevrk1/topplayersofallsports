-- V3: Remove old ad-hoc seeded football players (format: FOOTBALL_TOP100_*)
-- The Flyway V2 migration is now the canonical source of truth (format: football-top100-*).
-- Must delete all child FK rows first before removing from players.

DO $$
DECLARE old_ids BIGINT[];
BEGIN
    SELECT ARRAY(
        SELECT id FROM players
        WHERE sport = 'FOOTBALL' AND api_player_id LIKE 'FOOTBALL_%'
    ) INTO old_ids;

    -- Delete from all tables that have FK -> players
    DELETE FROM player_aliases      WHERE player_id = ANY(old_ids);
    DELETE FROM ai_analysis         WHERE player_id = ANY(old_ids);
    DELETE FROM rating_consensus    WHERE player_id = ANY(old_ids);
    DELETE FROM rating_history      WHERE player_id = ANY(old_ids);
    DELETE FROM rating_history      WHERE player_id = ANY(old_ids);

    DELETE FROM players WHERE id = ANY(old_ids);
END $$;
