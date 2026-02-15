-- Add transcript daily limit setting
INSERT INTO application_settings (setting_key, setting_value, description, created_at, updated_at)
VALUES ('transcript.daily_limit', '2', 'Daily limit of transcripts per user', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
ON CONFLICT (setting_key) DO NOTHING;
