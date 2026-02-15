package com.speakup.application.conversation.dto;

import com.speakup.domain.conversation.AnalysisStatus;
import com.speakup.domain.conversation.ConversationTranscript;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO for transcript data.
 */
@Builder
public record TranscriptDTO(
        UUID id,
        UUID conversationId,
        UUID requesterId,
        String transcriptData,
        boolean includeAnalysis,
        AnalysisStatus analysisStatus,
        String errorMessage,
        Instant createdAt
) {

    public static TranscriptDTO from(ConversationTranscript transcript) {
        return TranscriptDTO.builder()
                .id(transcript.getId())
                .conversationId(transcript.getConversation().getId())
                .requesterId(transcript.getRequester().getId())
                .transcriptData(transcript.getTranscriptData())
                .includeAnalysis(transcript.isIncludeAnalysis())
                .analysisStatus(transcript.getAnalysisStatus())
                .errorMessage(transcript.getErrorMessage())
                .createdAt(transcript.getCreatedAt())
                .build();
    }
}
