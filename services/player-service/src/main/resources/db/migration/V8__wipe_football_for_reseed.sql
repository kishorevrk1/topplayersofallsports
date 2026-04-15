-- V8: Originally wiped football players + rating tables to fix corrupted seed data.
-- Now a no-op: V1 creates schema fresh, V2 seeds football correctly from the start.
-- Kept in version history for schema continuity on any existing DBs that already ran V8.
SELECT 1;
