-- Add call duration configuration to sessions
ALTER TABLE sessions ADD COLUMN call_duration_seconds INTEGER NOT NULL DEFAULT 600;

-- Add comment for documentation
COMMENT ON COLUMN sessions.call_duration_seconds IS 'Duration of each 1:1 call in seconds. Default is 600 (10 minutes).';
