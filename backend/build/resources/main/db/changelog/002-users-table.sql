--liquibase formatted sql

--changeset topplayersofallsports:002-users-table
--comment: Create users table for authentication and user management

CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    first_name VARCHAR(50) NOT NULL,
    last_name VARCHAR(50) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    password VARCHAR(100) NOT NULL,
    avatar_url VARCHAR(255),
    bio VARCHAR(500),
    phone VARCHAR(20),
    date_of_birth TIMESTAMP,
    country VARCHAR(100),
    favorite_sports TEXT, -- JSON array stored as string
    favorite_teams TEXT, -- JSON array stored as string
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_login TIMESTAMP,
    role VARCHAR(20) NOT NULL DEFAULT 'USER', -- ADMIN, MODERATOR, EDITOR, USER
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    version BIGINT NOT NULL DEFAULT 0
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(first_name, last_name);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_role ON users(role);

--rollback DROP TABLE users;
