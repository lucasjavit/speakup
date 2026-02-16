-- Add phone fields to users table
ALTER TABLE users
ADD COLUMN IF NOT EXISTS phone_country_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
