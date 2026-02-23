-- Migration: 002_create_attendance
-- Creates the attendance_records table.

CREATE TYPE attendance_status AS ENUM (
    'present',
    'absent',
    'late',
    'half_day',
    'holiday',
    'leave'
);

CREATE TABLE IF NOT EXISTS attendance_records (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id     UUID        NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
    date            DATE        NOT NULL,
    check_in_time   TIMESTAMPTZ,
    check_out_time  TIMESTAMPTZ,
    status          attendance_status NOT NULL DEFAULT 'present',
    notes           TEXT,
    -- Computed total_hours; derived column kept for query convenience
    total_hours     NUMERIC(5, 2) GENERATED ALWAYS AS (
        CASE
            WHEN check_in_time IS NOT NULL AND check_out_time IS NOT NULL
            THEN EXTRACT(EPOCH FROM (check_out_time - check_in_time)) / 3600.0
            ELSE NULL
        END
    ) STORED,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One record per employee per day
    CONSTRAINT uq_employee_date UNIQUE (employee_id, date),

    -- check_out must be after check_in when both are present
    CONSTRAINT chk_checkout_after_checkin
        CHECK (check_out_time IS NULL OR check_in_time IS NULL OR check_out_time > check_in_time)
);

CREATE TRIGGER attendance_updated_at
    BEFORE UPDATE ON attendance_records
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX idx_attendance_employee_id ON attendance_records(employee_id);
CREATE INDEX idx_attendance_date        ON attendance_records(date);
CREATE INDEX idx_attendance_status      ON attendance_records(status);
CREATE INDEX idx_attendance_emp_date    ON attendance_records(employee_id, date DESC);
