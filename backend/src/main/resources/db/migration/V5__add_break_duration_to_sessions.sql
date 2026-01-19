-- Add break duration field to sessions table
-- Default is 30 seconds

ALTER TABLE sessions
ADD COLUMN break_duration_seconds INTEGER NOT NULL DEFAULT 30;
