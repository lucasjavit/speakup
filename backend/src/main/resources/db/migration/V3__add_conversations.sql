-- V3: Add conversations table for video call records

-- Conversation status enum check
-- Status: WAITING (matched but not connected), ACTIVE (in call), COMPLETED, CANCELLED

CREATE TABLE conversations (
    id UUID PRIMARY KEY,
    user_a_id UUID NOT NULL REFERENCES users(id),
    user_b_id UUID NOT NULL REFERENCES users(id),
    session_id UUID REFERENCES sessions(id),
    topic TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    ended_at TIMESTAMP WITH TIME ZONE,
    duration_seconds INTEGER,
    recording_url_a TEXT,
    recording_url_b TEXT,
    status VARCHAR(50) NOT NULL DEFAULT 'WAITING',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_conversation_status CHECK (status IN ('WAITING', 'ACTIVE', 'COMPLETED', 'CANCELLED')),
    CONSTRAINT chk_different_users CHECK (user_a_id != user_b_id)
);

-- Indexes for common queries
CREATE INDEX idx_conversation_user_a ON conversations(user_a_id);
CREATE INDEX idx_conversation_user_b ON conversations(user_b_id);
CREATE INDEX idx_conversation_session ON conversations(session_id);
CREATE INDEX idx_conversation_status ON conversations(status);
CREATE INDEX idx_conversation_created_at ON conversations(created_at DESC);

-- Composite index for checking if two users already had a conversation in the same session
CREATE INDEX idx_conversation_users_session ON conversations(user_a_id, user_b_id, session_id);

-- Add comment
COMMENT ON TABLE conversations IS 'Records of video conversations between users';
COMMENT ON COLUMN conversations.user_a_id IS 'First user in the conversation (initiator)';
COMMENT ON COLUMN conversations.user_b_id IS 'Second user in the conversation';
COMMENT ON COLUMN conversations.session_id IS 'Reference to the admin-defined session period';
COMMENT ON COLUMN conversations.topic IS 'AI-generated conversation topic';
COMMENT ON COLUMN conversations.recording_url_a IS 'URL to user A audio recording (optional)';
COMMENT ON COLUMN conversations.recording_url_b IS 'URL to user B audio recording (optional)';
COMMENT ON COLUMN conversations.status IS 'WAITING: matched, ACTIVE: in call, COMPLETED: finished, CANCELLED: aborted';
