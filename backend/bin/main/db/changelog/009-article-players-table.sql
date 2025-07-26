--liquibase formatted sql

--changeset topplayersofallsports:009-article-players-table
--comment: Create article_players junction table for many-to-many relationship between articles and players

CREATE TABLE article_players (
    id BIGSERIAL PRIMARY KEY,
    article_id BIGINT NOT NULL,
    player_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (article_id) REFERENCES news_articles(id) ON DELETE CASCADE,
    FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE,
    -- Prevent duplicate relationships
    UNIQUE(article_id, player_id)
);

-- Create indexes for better performance
CREATE INDEX idx_article_players_article ON article_players(article_id);
CREATE INDEX idx_article_players_player ON article_players(player_id);

--rollback DROP TABLE article_players;
