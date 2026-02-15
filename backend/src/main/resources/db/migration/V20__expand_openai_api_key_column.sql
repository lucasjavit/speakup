-- Expand openai_api_key column to TEXT to support encrypted values (AES-GCM + Base64)
ALTER TABLE users ALTER COLUMN openai_api_key TYPE TEXT;
