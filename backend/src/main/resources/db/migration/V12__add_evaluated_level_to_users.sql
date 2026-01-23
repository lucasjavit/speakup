-- Migration V11: Add evaluated level fields to users table
-- Adds fields to track user's evaluated proficiency level based on partner ratings

ALTER TABLE users
ADD COLUMN evaluated_level VARCHAR(50),
ADD COLUMN total_evaluations INTEGER DEFAULT 0,
ADD COLUMN last_evaluation_at TIMESTAMP WITH TIME ZONE;

-- Add comments for documentation
COMMENT ON COLUMN users.evaluated_level IS 'Nível calculado baseado em avaliações de parceiros';
COMMENT ON COLUMN users.total_evaluations IS 'Total de avaliações recebidas';
COMMENT ON COLUMN users.last_evaluation_at IS 'Data da última avaliação recebida';
