--liquibase formatted sql

--changeset topplayersofallsports:006-comments-table
--comment: Create comments table for user comments on articles and videos

CREATE TABLE comments (
    id BIGSERIAL PRIMARY KEY,
    content VARCHAR(1000) NOT NULL,
    is_approved BOOLEAN NOT NULL DEFAULT FALSE,
    is_flagged BOOLEAN NOT NULL DEFAULT FALSE,
    likes_count BIGINT NOT NULL DEFAULT 0,
    dislikes_count BIGINT NOT NULL DEFAULT 0,
    user_id BIGINT NOT NULL,
    article_id BIGINT,
    video_id BIGINT,
    parent_id BIGINT, -- for nested comments (replies)
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (article_id) REFERENCES news_articles(id) ON DELETE CASCADE,
    FOREIGN KEY (video_id) REFERENCES video_highlights(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_id) REFERENCES comments(id) ON DELETE CASCADE,
    -- Ensure comment is associated with either article or video, but not both
    CHECK ((article_id IS NOT NULL AND video_id IS NULL) OR (article_id IS NULL AND video_id IS NOT NULL))
);

-- Create indexes for better performance
CREATE INDEX idx_comments_user ON comments(user_id);
CREATE INDEX idx_comments_article ON comments(article_id);
CREATE INDEX idx_comments_video ON comments(video_id);
CREATE INDEX idx_comments_parent ON comments(parent_id);
CREATE INDEX idx_comments_approved ON comments(is_approved);
CREATE INDEX idx_comments_flagged ON comments(is_flagged);
CREATE INDEX idx_comments_created ON comments(created_at);

--rollback DROP TABLE comments;
