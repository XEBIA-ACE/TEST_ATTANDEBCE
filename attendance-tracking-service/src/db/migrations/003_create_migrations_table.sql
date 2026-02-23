-- Migration: 003_create_migrations_table
-- Tracks which migrations have been applied.

CREATE TABLE IF NOT EXISTS schema_migrations (
    id          SERIAL PRIMARY KEY,
    filename    VARCHAR(255) NOT NULL UNIQUE,
    applied_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
