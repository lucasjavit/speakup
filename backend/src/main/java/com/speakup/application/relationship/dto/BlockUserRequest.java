package com.speakup.application.relationship.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Request to block a user.
 */
public record BlockUserRequest(
        @NotNull(message = "Target user ID is required")
        UUID targetUserId,

        UUID conversationId
) {
}
