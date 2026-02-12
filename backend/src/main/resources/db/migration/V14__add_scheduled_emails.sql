CREATE TABLE scheduled_emails (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject VARCHAR(200) NOT NULL,
    body TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    sent_at TIMESTAMP WITH TIME ZONE,
    recipient_type VARCHAR(20) NOT NULL DEFAULT 'ALL',
    user_ids TEXT,
    recipient_count INTEGER DEFAULT 0,
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_scheduled_emails_status_scheduled_at ON scheduled_emails (status, scheduled_at);
