-- V2: Add role to users and create sessions table

-- Add role column to users table
ALTER TABLE users ADD COLUMN role VARCHAR(50) NOT NULL DEFAULT 'USER';

-- Create index for role lookups
CREATE INDEX idx_user_role ON users(role);

-- Update comment
COMMENT ON COLUMN users.role IS 'User role: USER, MODERATOR, PAYMENT_ADMIN, SUPER_ADMIN';

-- Create sessions table for recurring practice periods
CREATE TABLE sessions (
    id UUID PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    timezone VARCHAR(100) NOT NULL,
    days_of_week VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for sessions
CREATE INDEX idx_session_status ON sessions(status);

-- Comments
COMMENT ON TABLE sessions IS 'Recurring practice session periods';
COMMENT ON COLUMN sessions.name IS 'Display name for the session (e.g., Morning Session)';
COMMENT ON COLUMN sessions.start_time IS 'Session start time (e.g., 07:00)';
COMMENT ON COLUMN sessions.end_time IS 'Session end time (e.g., 08:00)';
COMMENT ON COLUMN sessions.timezone IS 'Timezone for the session (e.g., America/Sao_Paulo)';
COMMENT ON COLUMN sessions.days_of_week IS 'Comma-separated days (e.g., MONDAY,WEDNESDAY,FRIDAY)';
COMMENT ON COLUMN sessions.status IS 'Session status: ACTIVE, INACTIVE';
