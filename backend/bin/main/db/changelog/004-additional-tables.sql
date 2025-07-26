--liquibase formatted sql

--changeset topplayersofallsports:004-additional-tables context:dev

-- Video highlights table - matching VideoHighlight entity exactly
CREATE TABLE video_highlights (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description VARCHAR(500),
    video_url VARCHAR(255) NOT NULL,
    thumbnail_url VARCHAR(255),
    duration INTEGER NOT NULL,
    sport VARCHAR(50) NOT NULL,
    highlight_type VARCHAR(50) NOT NULL DEFAULT 'GAME_HIGHLIGHT',
    tags VARCHAR(1000),
    published_at TIMESTAMP,
    view_count BIGINT NOT NULL DEFAULT 0,
    like_count BIGINT NOT NULL DEFAULT 0,
    dislike_count BIGINT NOT NULL DEFAULT 0,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    is_trending BOOLEAN NOT NULL DEFAULT FALSE,
    ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
    external_source VARCHAR(255),
    external_id VARCHAR(255),
    player_id BIGINT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE SET NULL
);

-- Comments table - matching Comment entity exactly
CREATE TABLE comments (
    id BIGSERIAL PRIMARY KEY,
    content VARCHAR(1000) NOT NULL,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
    likes_count BIGINT NOT NULL DEFAULT 0,
    dislikes_count BIGINT NOT NULL DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id BIGINT NOT NULL,
    article_id BIGINT,
    video_id BIGINT,
    parent_id BIGINT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (article_id) REFERENCES news_articles(id) ON DELETE CASCADE,
    FOREIGN KEY (video_id) REFERENCES video_highlights(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE
);

-- User favorites table - matching UserFavorite entity exactly
CREATE TABLE user_favorites (
    id BIGSERIAL PRIMARY KEY,
    favorite_type VARCHAR(50) NOT NULL,
    entity_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id BIGINT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Article-Players join table for Many-to-Many relationship
CREATE TABLE article_players (
    id BIGSERIAL PRIMARY KEY,
    article_id BIGINT NOT NULL,
    player_id BIGINT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES news_articles(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    UNIQUE(article_id, player_id)
);
