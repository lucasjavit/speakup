package com.speakup.application.conversation.dto;

import com.speakup.domain.conversation.AnalysisStatus;
import com.speakup.domain.conversation.ConversationAnalysis;
import com.speakup.domain.conversation.ConversationTranscript;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

/**
 * Complete DTO with transcript and analysis data.
 */
@Builder
public record TranscriptWithAnalysisDTO(
        UUID id,
        UUID conversationId,
        String partnerName,
        String partnerAvatarUrl,
        Instant conversationDate,
        Integer conversationDurationSeconds,
        String transcriptData,
        boolean includeAnalysis,
        AnalysisStatus analysisStatus,
        String errorMessage,
        AnalysisDTO analysis,
        Instant createdAt
) {

    public static TranscriptWithAnalysisDTO from(ConversationTranscript transcript, ConversationAnalysis analysis) {
        var conversation = transcript.getConversation();
        var partner = conversation.getOtherUser(transcript.getRequester());
        
        return TranscriptWithAnalysisDTO.builder()
                .id(transcript.getId())
                .conversationId(conversation.getId())
                .partnerName(partner.getName())
                .partnerAvatarUrl(partner.getAvatarUrl())
                .conversationDate(conversation.getStartedAt() != null ? conversation.getStartedAt() : conversation.getCreatedAt())
                .conversationDurationSeconds(conversation.getDurationSeconds())
                .transcriptData(transcript.getTranscriptData())
                .includeAnalysis(transcript.isIncludeAnalysis())
                .analysisStatus(transcript.getAnalysisStatus())
                .errorMessage(transcript.getErrorMessage())
                .analysis(analysis != null ? AnalysisDTO.from(analysis) : null)
                .createdAt(transcript.getCreatedAt())
                .build();
    }
}
