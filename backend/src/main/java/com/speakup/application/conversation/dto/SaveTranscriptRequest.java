package com.speakup.application.conversation.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

/**
 * Request DTO for saving a conversation transcript.
 */
public record SaveTranscriptRequest(
        @NotNull(message = "Conversation ID is required")
        UUID conversationId,

        @NotBlank(message = "Transcript data is required")
        String transcriptData,

        boolean includeAnalysis
) {
}
