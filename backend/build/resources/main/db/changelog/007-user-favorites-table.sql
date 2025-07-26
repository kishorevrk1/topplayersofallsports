--liquibase formatted sql

--changeset topplayersofallsports:007-user-favorites-table
--comment: Create user_favorites table for user's favorite items

CREATE TABLE user_favorites (
    id BIGSERIAL PRIMARY KEY,
    favorite_type VARCHAR(50) NOT NULL, -- PLAYER, ARTICLE, VIDEO, TEAM
    entity_id BIGINT NOT NULL, -- ID of the favorited entity
    user_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    -- Prevent duplicate favorites for same user and entity
    UNIQUE(user_id, favorite_type, entity_id)
);

-- Create indexes for better performance
CREATE INDEX idx_favorites_user ON user_favorites(user_id);
CREATE INDEX idx_favorites_type ON user_favorites(favorite_type);
CREATE INDEX idx_favorites_entity ON user_favorites(entity_id);
CREATE INDEX idx_favorites_user_type ON user_favorites(user_id, favorite_type);

--rollback DROP TABLE user_favorites;
