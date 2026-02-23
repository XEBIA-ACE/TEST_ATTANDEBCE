-- Migration: 001_create_employees
-- Creates the employees table with audit timestamps.

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS employees (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_code   VARCHAR(20)  NOT NULL UNIQUE,
    first_name      VARCHAR(100) NOT NULL,
    last_name       VARCHAR(100) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    department      VARCHAR(100),
    position        VARCHAR(100),
    hire_date       DATE,
    is_active       BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Auto-update updated_at on any row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER employees_updated_at
    BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index for common lookup patterns
CREATE INDEX idx_employees_email       ON employees(email);
CREATE INDEX idx_employees_code        ON employees(employee_code);
CREATE INDEX idx_employees_department  ON employees(department);
CREATE INDEX idx_employees_is_active   ON employees(is_active);
