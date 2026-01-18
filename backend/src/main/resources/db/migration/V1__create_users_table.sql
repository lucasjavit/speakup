-- V1: Create users table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500),
    provider VARCHAR(50) NOT NULL,
    provider_id VARCHAR(255) NOT NULL,
    native_language VARCHAR(50),
    target_language VARCHAR(50),
    proficiency_level VARCHAR(50),
    timezone VARCHAR(100),
    profile_completed BOOLEAN NOT NULL DEFAULT FALSE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_user_email ON users(email);
CREATE INDEX idx_user_provider_id ON users(provider_id);
CREATE INDEX idx_user_provider_provider_id ON users(provider, provider_id);

-- Comments
COMMENT ON TABLE users IS 'Platform users';
COMMENT ON COLUMN users.provider IS 'OAuth provider: GOOGLE, GITHUB';
COMMENT ON COLUMN users.proficiency_level IS 'BEGINNER, INTERMEDIATE, ADVANCED';
