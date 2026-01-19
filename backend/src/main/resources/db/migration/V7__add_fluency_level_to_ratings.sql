-- Add partner fluency level to ratings table
ALTER TABLE ratings
ADD COLUMN partner_fluency_level VARCHAR(20)
CHECK (partner_fluency_level IN ('BASIC', 'ELEMENTARY', 'LEVEL_UP', 'EXPERT'));
