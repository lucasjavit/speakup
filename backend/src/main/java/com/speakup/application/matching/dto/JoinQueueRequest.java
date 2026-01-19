package com.speakup.application.matching.dto;

import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Request to join the matching queue.
 */
public record JoinQueueRequest(
        @NotNull(message = "Session ID is required")
        UUID sessionId
) {
}
