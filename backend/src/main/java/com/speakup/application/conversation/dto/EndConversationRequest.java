package com.speakup.application.conversation.dto;

/**
 * Request to end a conversation.
 */
public record EndConversationRequest(
        boolean completed
) {
}
