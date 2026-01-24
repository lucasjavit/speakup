-- V13: Simplify proficiency levels from 6 CEFR levels to 4 simple levels
-- This migration converts existing user levels to the new 4-level system:
-- BEGINNER (A1) -> BASIC
-- ELEMENTARY (A2) -> ELEMENTARY
-- INTERMEDIATE (B1) -> LEVEL_UP
-- UPPER_INTERMEDIATE (B2) -> LEVEL_UP
-- ADVANCED (C1) -> EXPERT
-- FLUENT (C2) -> EXPERT

-- Update proficiency_level in users table
UPDATE users
SET proficiency_level = CASE
    WHEN proficiency_level = 'BEGINNER' THEN 'BASIC'
    WHEN proficiency_level = 'ELEMENTARY' THEN 'ELEMENTARY'
    WHEN proficiency_level = 'INTERMEDIATE' THEN 'LEVEL_UP'
    WHEN proficiency_level = 'UPPER_INTERMEDIATE' THEN 'LEVEL_UP'
    WHEN proficiency_level = 'ADVANCED' THEN 'EXPERT'
    WHEN proficiency_level = 'FLUENT' THEN 'EXPERT'
    ELSE proficiency_level
END
WHERE proficiency_level IS NOT NULL;

-- Update evaluated_level in users table (if column exists from V12)
UPDATE users
SET evaluated_level = CASE
    WHEN evaluated_level = 'BEGINNER' THEN 'BASIC'
    WHEN evaluated_level = 'ELEMENTARY' THEN 'ELEMENTARY'
    WHEN evaluated_level = 'INTERMEDIATE' THEN 'LEVEL_UP'
    WHEN evaluated_level = 'UPPER_INTERMEDIATE' THEN 'LEVEL_UP'
    WHEN evaluated_level = 'ADVANCED' THEN 'EXPERT'
    WHEN evaluated_level = 'FLUENT' THEN 'EXPERT'
    ELSE evaluated_level
END
WHERE evaluated_level IS NOT NULL;

-- Update comments
COMMENT ON COLUMN users.proficiency_level IS 'User proficiency level: BASIC, ELEMENTARY, LEVEL_UP, or EXPERT';
COMMENT ON COLUMN users.evaluated_level IS 'Evaluated proficiency level based on partner ratings: BASIC, ELEMENTARY, LEVEL_UP, or EXPERT';
