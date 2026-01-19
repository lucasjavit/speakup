-- V6: Add ratings and user relationships tables

-- Ratings table for post-conversation feedback
CREATE TABLE ratings (
    id UUID PRIMARY KEY,
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    rater_id UUID NOT NULL REFERENCES users(id),
    rated_user_id UUID NOT NULL REFERENCES users(id),
    stars INTEGER NOT NULL,
    want_to_talk_again BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_rating_stars CHECK (stars >= 1 AND stars <= 5),
    CONSTRAINT chk_rating_different_users CHECK (rater_id != rated_user_id),
    CONSTRAINT uk_rating_conversation_rater UNIQUE (conversation_id, rater_id)
);

-- Indexes for ratings
CREATE INDEX idx_rating_conversation ON ratings(conversation_id);
CREATE INDEX idx_rating_rater ON ratings(rater_id);
CREATE INDEX idx_rating_rated_user ON ratings(rated_user_id);

-- User relationships table for favorites and blocks
CREATE TABLE user_relationships (
    id UUID PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id),
    target_user_id UUID NOT NULL REFERENCES users(id),
    type VARCHAR(50) NOT NULL,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT chk_relationship_type CHECK (type IN ('FAVORITE', 'BLOCK')),
    CONSTRAINT chk_relationship_different_users CHECK (user_id != target_user_id),
    CONSTRAINT uk_user_target_type UNIQUE (user_id, target_user_id, type)
);

-- Indexes for user relationships
CREATE INDEX idx_relationship_user ON user_relationships(user_id);
CREATE INDEX idx_relationship_target ON user_relationships(target_user_id);
CREATE INDEX idx_relationship_type ON user_relationships(type);
CREATE INDEX idx_relationship_user_type ON user_relationships(user_id, type);
