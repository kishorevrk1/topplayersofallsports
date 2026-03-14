-- V6: Bring auth tables under Flyway schema management.
-- Tables may already exist (created by Hibernate ddl-auto:update) so IF NOT EXISTS is used.
-- In production, set ddl-auto to validate once this migration is confirmed stable.

CREATE TABLE IF NOT EXISTS users (
    id          VARCHAR(36)  PRIMARY KEY,
    email       VARCHAR(255) NOT NULL,
    name        VARCHAR(255) NOT NULL,
    google_id   VARCHAR(255),
    role        VARCHAR(20)  NOT NULL DEFAULT 'USER',
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_users_email     UNIQUE (email),
    CONSTRAINT uq_users_google_id UNIQUE (google_id)
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id          VARCHAR(36)  PRIMARY KEY,
    token       VARCHAR(255) NOT NULL,
    user_id     VARCHAR(36)  NOT NULL,
    expires_at  TIMESTAMP    NOT NULL,
    created_at  TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_refresh_tokens_token UNIQUE (token),
    CONSTRAINT fk_refresh_tokens_user  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id   ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_expires_at ON refresh_tokens(expires_at);
