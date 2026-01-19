package com.speakup.application.matching.dto;

import lombok.Builder;

import java.util.UUID;

/**
 * Response for queue status.
 */
@Builder
public record QueueStatusResponse(
        boolean inQueue,
        UUID sessionId,
        int position,
        int estimatedWaitSeconds,
        long queueSize
) {
}
