--liquibase formatted sql

--changeset topplayersofallsports:010-performance-indexes
--comment: Create additional performance indexes for optimized queries

-- Full-text search indexes for PostgreSQL
CREATE INDEX idx_users_fulltext ON users USING gin(to_tsvector('english', first_name || ' ' || last_name || ' ' || COALESCE(bio, '')));
CREATE INDEX idx_players_fulltext ON players USING gin(to_tsvector('english', name || ' ' || team || ' ' || position || ' ' || COALESCE(biography, '')));
CREATE INDEX idx_articles_fulltext ON news_articles USING gin(to_tsvector('english', title || ' ' || summary || ' ' || content));
CREATE INDEX idx_videos_fulltext ON video_highlights USING gin(to_tsvector('english', title || ' ' || COALESCE(description, '')));

-- Composite indexes for common query patterns
CREATE INDEX idx_articles_category_status ON news_articles(category, status);
CREATE INDEX idx_articles_published_category ON news_articles(published_at DESC, category) WHERE status = 'PUBLISHED';
CREATE INDEX idx_articles_trending_featured ON news_articles(is_trending, is_featured, published_at DESC);

CREATE INDEX idx_videos_sport_featured ON video_highlights(sport, is_featured);
CREATE INDEX idx_videos_trending_sport ON video_highlights(is_trending, sport, published_at DESC);
CREATE INDEX idx_videos_player_sport ON video_highlights(player_id, sport);

CREATE INDEX idx_players_sport_featured ON players(sport, is_featured);
CREATE INDEX idx_players_team_position ON players(team, position);

CREATE INDEX idx_comments_article_approved ON comments(article_id, is_approved, created_at DESC);
CREATE INDEX idx_comments_video_approved ON comments(video_id, is_approved, created_at DESC);

-- Partial indexes for better performance on filtered queries
CREATE INDEX idx_active_players ON players(name, sport) WHERE is_active = TRUE;
CREATE INDEX idx_featured_players ON players(view_count DESC) WHERE is_featured = TRUE;
CREATE INDEX idx_published_articles ON news_articles(published_at DESC) WHERE status = 'PUBLISHED';
CREATE INDEX idx_approved_comments ON comments(created_at DESC) WHERE is_approved = TRUE;

--rollback DROP INDEX IF EXISTS idx_users_fulltext;
--rollback DROP INDEX IF EXISTS idx_players_fulltext;
--rollback DROP INDEX IF EXISTS idx_articles_fulltext;
--rollback DROP INDEX IF EXISTS idx_videos_fulltext;
--rollback DROP INDEX IF EXISTS idx_articles_category_status;
--rollback DROP INDEX IF EXISTS idx_articles_published_category;
--rollback DROP INDEX IF EXISTS idx_articles_trending_featured;
--rollback DROP INDEX IF EXISTS idx_videos_sport_featured;
--rollback DROP INDEX IF EXISTS idx_videos_trending_sport;
--rollback DROP INDEX IF EXISTS idx_videos_player_sport;
--rollback DROP INDEX IF EXISTS idx_players_sport_featured;
--rollback DROP INDEX IF EXISTS idx_players_team_position;
--rollback DROP INDEX IF EXISTS idx_comments_article_approved;
--rollback DROP INDEX IF EXISTS idx_comments_video_approved;
--rollback DROP INDEX IF EXISTS idx_active_players;
--rollback DROP INDEX IF EXISTS idx_featured_players;
--rollback DROP INDEX IF EXISTS idx_published_articles;
--rollback DROP INDEX IF EXISTS idx_approved_comments;
