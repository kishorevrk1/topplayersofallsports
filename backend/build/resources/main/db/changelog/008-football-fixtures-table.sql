--liquibase formatted sql

--changeset topplayersofallsports:008-football-fixtures-table
--comment: Create football_fixtures table for match data from API-Football

CREATE TABLE football_fixtures (
    id BIGSERIAL PRIMARY KEY,
    api_fixture_id BIGINT NOT NULL UNIQUE,
    home_team VARCHAR(100) NOT NULL,
    away_team VARCHAR(100) NOT NULL,
    home_team_logo VARCHAR(255),
    away_team_logo VARCHAR(255),
    league_name VARCHAR(100) NOT NULL,
    league_id INTEGER,
    league_country VARCHAR(100),
    league_logo VARCHAR(255),
    fixture_date TIMESTAMP NOT NULL,
    venue VARCHAR(200),
    venue_city VARCHAR(100),
    status VARCHAR(50), -- NS, 1H, 2H, FT, etc.
    round VARCHAR(100),
    season VARCHAR(10),
    home_score INTEGER,
    away_score INTEGER,
    score_status VARCHAR(50), -- halftime, fulltime, etc.
    ai_description VARCHAR(1000),
    ai_hashtags VARCHAR(500), -- comma-separated hashtags
    importance_score INTEGER DEFAULT 1, -- 1-5 scale
    match_type VARCHAR(20), -- regular, playoff, final, etc.
    broadcast_channels VARCHAR(500), -- comma-separated channels
    cache_date TIMESTAMP NOT NULL,
    is_live BOOLEAN NOT NULL DEFAULT FALSE,
    ai_processed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX idx_fixtures_api_id ON football_fixtures(api_fixture_id);
CREATE INDEX idx_fixtures_date ON football_fixtures(fixture_date);
CREATE INDEX idx_fixtures_league ON football_fixtures(league_name);
CREATE INDEX idx_fixtures_teams ON football_fixtures(home_team, away_team);
CREATE INDEX idx_fixtures_status ON football_fixtures(status);
CREATE INDEX idx_fixtures_live ON football_fixtures(is_live);
CREATE INDEX idx_fixtures_importance ON football_fixtures(importance_score);

--rollback DROP TABLE football_fixtures;
