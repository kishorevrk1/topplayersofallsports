--liquibase formatted sql

--changeset topplayersofallsports:003-players-table
--comment: Create players table for sports players

CREATE TABLE players (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    position VARCHAR(50) NOT NULL,
    team VARCHAR(100) NOT NULL,
    sport VARCHAR(20) NOT NULL, -- BASKETBALL, FOOTBALL, BASEBALL, HOCKEY, SOCCER, TENNIS, GOLF, ESPORTS
    jersey_number INTEGER,
    height VARCHAR(20), -- e.g., "6'2""
    weight VARCHAR(20), -- e.g., "180 lbs"
    birth_date DATE,
    birth_place VARCHAR(200),
    nationality VARCHAR(100),
    avatar_url VARCHAR(255),
    biography TEXT,
    career_stats TEXT, -- JSON stored as string
    season_stats TEXT, -- JSON stored as string
    achievements TEXT, -- JSON stored as string
    social_links TEXT, -- JSON stored as string
    salary VARCHAR(100),
    contract_until DATE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    view_count BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX idx_players_name ON players(name);
CREATE INDEX idx_players_sport ON players(sport);
CREATE INDEX idx_players_team ON players(team);
CREATE INDEX idx_players_position ON players(position);
CREATE INDEX idx_players_is_active ON players(is_active);
CREATE INDEX idx_players_is_featured ON players(is_featured);
CREATE INDEX idx_players_view_count ON players(view_count);

--rollback DROP TABLE players;
