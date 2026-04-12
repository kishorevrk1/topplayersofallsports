-- V6: Auth tables now created in V1. This migration is a no-op kept for schema history continuity.
-- All tables (users, refresh_tokens) were moved to V1 with IF NOT EXISTS guards.
SELECT 1;
