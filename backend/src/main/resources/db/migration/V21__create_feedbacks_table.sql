CREATE TABLE IF NOT EXISTS feedbacks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    user_email VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    screenshot_url VARCHAR(1000),
    screenshot_data TEXT,
    page_url VARCHAR(1000),
    user_agent VARCHAR(500),
    status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
    admin_notes TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedbacks(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedbacks(type);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedbacks(status);
CREATE INDEX IF NOT EXISTS idx_feedback_created_at ON feedbacks(created_at);
