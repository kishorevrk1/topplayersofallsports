--liquibase formatted sql

--changeset topplayersofallsports:005-video-highlights-table
--comment: Create video_highlights table for sports video content

CREATE TABLE video_highlights (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    video_url VARCHAR(255) NOT NULL,
    thumbnail_url VARCHAR(255),
    duration INTEGER NOT NULL, -- duration in seconds
    sport VARCHAR(20) NOT NULL, -- BASKETBALL, FOOTBALL, BASEBALL, HOCKEY, SOCCER, TENNIS, GOLF, ESPORTS
    highlight_type VARCHAR(50) NOT NULL DEFAULT 'GAME_HIGHLIGHT', -- GAME_HIGHLIGHT, BEST_PLAYS, GOALS, TOUCHDOWNS, DUNKS, HOME_RUNS, SAVES, INTERVIEWS
    tags TEXT, -- JSON array stored as string
    published_at TIMESTAMP,
    view_count BIGINT NOT NULL DEFAULT 0,
    like_count BIGINT NOT NULL DEFAULT 0,
    dislike_count BIGINT NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_trending BOOLEAN NOT NULL DEFAULT FALSE,
    ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
    external_source VARCHAR(255), -- YouTube, ESPN, etc.
    external_id VARCHAR(255),
    player_id BIGINT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE SET NULL
);

-- Create indexes for better performance
CREATE INDEX idx_video_title ON video_highlights(title);
CREATE INDEX idx_video_sport ON video_highlights(sport);
CREATE INDEX idx_video_type ON video_highlights(highlight_type);
CREATE INDEX idx_video_player ON video_highlights(player_id);
CREATE INDEX idx_video_published ON video_highlights(published_at);
CREATE INDEX idx_video_featured ON video_highlights(is_featured);
CREATE INDEX idx_video_trending ON video_highlights(is_trending);
CREATE INDEX idx_video_view_count ON video_highlights(view_count);
CREATE INDEX idx_video_external ON video_highlights(external_source, external_id);

--rollback DROP TABLE video_highlights;
