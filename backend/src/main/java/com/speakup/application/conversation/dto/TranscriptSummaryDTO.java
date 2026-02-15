package com.speakup.application.conversation.dto;

import com.speakup.domain.conversation.AnalysisStatus;
import com.speakup.domain.conversation.ConversationTranscript;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

/**
 * Summary DTO for transcript list.
 */
@Builder
public record TranscriptSummaryDTO(
        UUID id,
        UUID conversationId,
        String partnerName,
        String partnerAvatarUrl,
        Instant conversationDate,
        boolean hasAnalysis,
        AnalysisStatus analysisStatus,
        Instant createdAt
) {

    public static TranscriptSummaryDTO from(ConversationTranscript transcript) {
        var conversation = transcript.getConversation();
        var partner = conversation.getOtherUser(transcript.getRequester());
        
        return TranscriptSummaryDTO.builder()
                .id(transcript.getId())
                .conversationId(conversation.getId())
                .partnerName(partner.getName())
                .partnerAvatarUrl(partner.getAvatarUrl())
                .conversationDate(conversation.getStartedAt() != null ? conversation.getStartedAt() : conversation.getCreatedAt())
                .hasAnalysis(transcript.isIncludeAnalysis())
                .analysisStatus(transcript.getAnalysisStatus())
                .createdAt(transcript.getCreatedAt())
                .build();
    }
}
