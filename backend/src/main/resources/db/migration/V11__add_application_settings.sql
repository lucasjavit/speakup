-- Application settings table for global configurations
CREATE TABLE application_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    setting_key VARCHAR(100) NOT NULL UNIQUE,
    setting_value VARCHAR(500) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default settings
INSERT INTO application_settings (setting_key, setting_value, description) VALUES
    ('FREE_MODE_ENABLED', 'true', 'When enabled, users can join sessions without spending credits'),
    ('FREE_MODE_MESSAGE', 'Aproveite o período gratuito!', 'Message displayed to users when free mode is active');

CREATE INDEX idx_application_settings_key ON application_settings(setting_key);
