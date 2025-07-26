-- Liquibase formatted SQL

-- changeset liquibase:012-add-oauth2-fields-to-users context:dev
-- comment: Add OAuth2 provider and provider_id fields to users table

ALTER TABLE users 
ADD COLUMN provider VARCHAR(50),
ADD COLUMN provider_id VARCHAR(100);

-- Add index on provider_id for efficient OAuth2 user lookups
CREATE INDEX idx_users_provider_id ON users(provider, provider_id);

-- rollback ALTER TABLE users DROP COLUMN provider, DROP COLUMN provider_id; DROP INDEX idx_users_provider_id;
