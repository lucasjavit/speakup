package com.speakup.domain.conversation;

/**
 * Status of a conversation between two users.
 */
public enum ConversationStatus {
    /**
     * Users have been matched but not yet connected via WebRTC.
     */
    WAITING,

    /**
     * Users are actively in a video call.
     */
    ACTIVE,

    /**
     * Conversation completed normally (timer ended or user left).
     */
    COMPLETED,

    /**
     * Conversation was cancelled (connection failed, user disconnected unexpectedly).
     */
    CANCELLED
}
