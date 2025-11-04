-- V1: Create core tables for HighlightsSvc
-- Optimized for PostgreSQL with proper indexing and constraints

-- Enable JSONB support (if not already enabled)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Highlight sources configuration table
CREATE TABLE highlight_sources (
    id BIGSERIAL PRIMARY KEY,
    type VARCHAR(50) NOT NULL CHECK (type IN ('YOUTUBE_CHANNEL', 'YOUTUBE_PLAYLIST')),
    channel_id VARCHAR(100),
    playlist_id VARCHAR(100),
    name VARCHAR(200) NOT NULL,
    sport VARCHAR(50),
    league_id VARCHAR(100),
    team_id VARCHAR(100),
    active BOOLEAN NOT NULL DEFAULT true,
    weight INTEGER NOT NULL DEFAULT 1 CHECK (weight >= 1 AND weight <= 5),
    last_ingested_at TIMESTAMP WITH TIME ZONE,
    last_video_published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_source_id CHECK (
        (type = 'YOUTUBE_CHANNEL' AND channel_id IS NOT NULL) OR
        (type = 'YOUTUBE_PLAYLIST' AND playlist_id IS NOT NULL)
    )
);

-- Indexes for efficient source queries
CREATE INDEX idx_sources_active_weight ON highlight_sources(active, weight DESC) WHERE active = true;
CREATE INDEX idx_sources_sport_league ON highlight_sources(sport, league_id);

-- Main highlights table
CREATE TABLE highlights (
    id BIGSERIAL PRIMARY KEY,
    platform VARCHAR(50) NOT NULL CHECK (platform IN ('YOUTUBE', 'TWITTER', 'INSTAGRAM', 'TIKTOK')),
    video_id VARCHAR(100) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    url VARCHAR(1000) NOT NULL,
    thumbnail_url VARCHAR(1000),
    published_at TIMESTAMP WITH TIME ZONE NOT NULL,
    duration_sec INTEGER,
    sport VARCHAR(50),
    league_id VARCHAR(100),
    view_count BIGINT,
    like_count BIGINT,
    stats_json JSONB,
    source_id BIGINT REFERENCES highlight_sources(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT uq_platform_video_id UNIQUE (platform, video_id)
);

-- Indexes for efficient highlight queries
CREATE INDEX idx_highlights_published_at ON highlights(published_at DESC);
CREATE INDEX idx_highlights_sport_league ON highlights(sport, league_id);
CREATE INDEX idx_highlights_source ON highlights(source_id);
-- Trending index without time filter (filter will be done in query)
CREATE INDEX idx_highlights_trending ON highlights(published_at DESC, view_count DESC, like_count DESC);

-- JSONB index for flexible stats queries
CREATE INDEX idx_highlights_stats_json ON highlights USING GIN (stats_json);

-- Entity tags table (teams, players, leagues, games)
CREATE TABLE highlight_entities (
    id BIGSERIAL PRIMARY KEY,
    highlight_id BIGINT NOT NULL REFERENCES highlights(id) ON DELETE CASCADE,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('TEAM', 'PLAYER', 'LEAGUE', 'GAME')),
    entity_id VARCHAR(100) NOT NULL,
    
    CONSTRAINT uq_highlight_entity UNIQUE (highlight_id, entity_type, entity_id)
);

-- Indexes for entity-based queries
CREATE INDEX idx_highlight_entities_type_id ON highlight_entities(entity_type, entity_id);
CREATE INDEX idx_highlight_entities_highlight ON highlight_entities(highlight_id);

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for auto-updating timestamps
CREATE TRIGGER update_highlight_sources_updated_at
    BEFORE UPDATE ON highlight_sources
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_highlights_updated_at
    BEFORE UPDATE ON highlights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE highlight_sources IS 'Configuration for video highlight sources (YouTube channels/playlists)';
COMMENT ON TABLE highlights IS 'Video highlights from various platforms with engagement metrics';
COMMENT ON TABLE highlight_entities IS 'Entity tags linking highlights to teams, players, leagues, and games';
COMMENT ON COLUMN highlights.stats_json IS 'Flexible JSONB storage for platform-specific stats and metadata';
