--liquibase formatted sql

--changeset topplayersofallsports:001-database-extensions
--comment: Enable PostgreSQL extensions for better performance and functionality

-- Enable UUID extension for better primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pg_trgm for better text search performance
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Enable unaccent for better text matching
CREATE EXTENSION IF NOT EXISTS unaccent;

--rollback DROP EXTENSION IF EXISTS unaccent;
--rollback DROP EXTENSION IF EXISTS pg_trgm;
--rollback DROP EXTENSION IF EXISTS "uuid-ossp";
