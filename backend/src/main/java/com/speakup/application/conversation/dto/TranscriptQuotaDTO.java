package com.speakup.application.conversation.dto;

import lombok.Builder;

import java.time.Instant;

/**
 * DTO for transcript quota information.
 */
@Builder
public record TranscriptQuotaDTO(
        int available,
        int limit,
        Instant resetsAt
) {
}
