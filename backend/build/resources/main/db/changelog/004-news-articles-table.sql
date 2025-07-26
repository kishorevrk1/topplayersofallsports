--liquibase formatted sql

--changeset topplayersofallsports:004-news-articles-table
--comment: Create news_articles table for sports news content

CREATE TABLE news_articles (
    id BIGSERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    summary VARCHAR(500) NOT NULL,
    content TEXT NOT NULL,
    image_url VARCHAR(255),
    category VARCHAR(50) NOT NULL, -- NBA, NFL, MLB, NHL, SOCCER, TENNIS, GOLF, OLYMPICS, COLLEGE, ESPORTS, ALL
    status VARCHAR(20) NOT NULL DEFAULT 'DRAFT', -- DRAFT, PUBLISHED, ARCHIVED, DELETED
    tags TEXT, -- JSON array stored as string
    source VARCHAR(200),
    source_url VARCHAR(255),
    published_at TIMESTAMP,
    view_count BIGINT NOT NULL DEFAULT 0,
    is_breaking BOOLEAN NOT NULL DEFAULT FALSE,
    is_trending BOOLEAN NOT NULL DEFAULT FALSE,
    is_featured BOOLEAN NOT NULL DEFAULT FALSE,
    ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
    author_id BIGINT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX idx_news_title ON news_articles(title);
CREATE INDEX idx_news_category ON news_articles(category);
CREATE INDEX idx_news_status ON news_articles(status);
CREATE INDEX idx_news_published ON news_articles(published_at);
CREATE INDEX idx_news_author ON news_articles(author_id);
CREATE INDEX idx_news_featured ON news_articles(is_featured);
CREATE INDEX idx_news_trending ON news_articles(is_trending);
CREATE INDEX idx_news_breaking ON news_articles(is_breaking);
CREATE INDEX idx_news_view_count ON news_articles(view_count);

--rollback DROP TABLE news_articles;
