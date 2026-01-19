-- GDPR/LGPD Compliance: User Consent Management

CREATE TABLE user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    consent_type VARCHAR(50) NOT NULL,
    consented BOOLEAN NOT NULL DEFAULT false,
    ip_address VARCHAR(45),
    user_agent TEXT,
    consented_at TIMESTAMP WITH TIME ZONE,
    withdrawn_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, consent_type)
);

CREATE INDEX idx_user_consents_user_id ON user_consents(user_id);

COMMENT ON TABLE user_consents IS 'Tracks user consent for GDPR/LGPD compliance';
COMMENT ON COLUMN user_consents.consent_type IS 'Type: DATA_PROCESSING, RECORDING, MARKETING';
COMMENT ON COLUMN user_consents.ip_address IS 'IP address when consent was given';
COMMENT ON COLUMN user_consents.user_agent IS 'Browser/client user agent when consent was given';
COMMENT ON COLUMN user_consents.consented_at IS 'Timestamp when user gave consent';
COMMENT ON COLUMN user_consents.withdrawn_at IS 'Timestamp when user withdrew consent (if applicable)';
