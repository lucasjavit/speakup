-- Create conversation_transcripts table
CREATE TABLE IF NOT EXISTS conversation_transcripts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    transcript_data TEXT NOT NULL,
    include_analysis BOOLEAN NOT NULL DEFAULT false,
    analysis_status VARCHAR(20) NOT NULL DEFAULT 'NOT_REQUESTED',
    error_message TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_analysis_status CHECK (analysis_status IN ('NOT_REQUESTED', 'PENDING', 'COMPLETED', 'FAILED'))
);

-- Create conversation_analyses table
CREATE TABLE IF NOT EXISTS conversation_analyses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    transcript_id UUID NOT NULL UNIQUE REFERENCES conversation_transcripts(id) ON DELETE CASCADE,
    grammar_corrections TEXT,
    vocabulary_suggestions TEXT,
    fluency_analysis TEXT,
    estimated_level VARCHAR(10),
    natural_phrases TEXT,
    topics_practiced TEXT,
    overall_feedback TEXT,
    tokens_used INTEGER,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT chk_estimated_level CHECK (estimated_level IN ('A1', 'A2', 'B1', 'B2', 'C1', 'C2'))
);

-- Add transcript quota fields to users table (only if they don't exist)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'transcripts_today') THEN
        ALTER TABLE users ADD COLUMN transcripts_today INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'users' AND column_name = 'transcripts_day_reset_at') THEN
        ALTER TABLE users ADD COLUMN transcripts_day_reset_at TIMESTAMP;
    END IF;
END $$;

-- Create indexes for better query performance (only if they don't exist)
CREATE INDEX IF NOT EXISTS idx_transcripts_conversation ON conversation_transcripts(conversation_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_requester ON conversation_transcripts(requester_id);
CREATE INDEX IF NOT EXISTS idx_transcripts_status ON conversation_transcripts(analysis_status);
CREATE INDEX IF NOT EXISTS idx_analyses_transcript ON conversation_analyses(transcript_id);

-- Add comments for documentation
COMMENT ON TABLE conversation_transcripts IS 'Stores full text transcripts of conversations with timestamps';
COMMENT ON TABLE conversation_analyses IS 'AI-generated analysis of conversation transcripts';
COMMENT ON COLUMN users.transcripts_today IS 'Number of transcripts requested today (resets daily)';
COMMENT ON COLUMN users.transcripts_day_reset_at IS 'Timestamp of the last daily quota reset';
