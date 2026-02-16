package com.speakup.application.conversation.dto;

import com.speakup.domain.conversation.Conversation;
import com.speakup.domain.conversation.ConversationStatus;
import com.speakup.domain.conversation.ConversationTranscript;
import lombok.Builder;

import java.time.Instant;
import java.util.UUID;

/**
 * Response DTO for conversation data.
 */
@Builder
public record ConversationResponse(
        UUID id,
        UserSummary userA,
        UserSummary userB,
        UUID sessionId,
        String topic,
        Instant startedAt,
        Instant endedAt,
        Integer durationSeconds,
        ConversationStatus status,
        boolean hasRecordingA,
        boolean hasRecordingB,
        Instant createdAt,
        Integer callDurationSeconds,
        Integer breakDurationSeconds,
        boolean hasTranscript,
        UUID transcriptId
) {

    public static ConversationResponse from(Conversation conversation) {
        return from(conversation, null);
    }

    public static ConversationResponse from(Conversation conversation, ConversationTranscript transcript) {
        var session = conversation.getSession();
        return ConversationResponse.builder()
                .id(conversation.getId())
                .userA(UserSummary.from(conversation.getUserA()))
                .userB(UserSummary.from(conversation.getUserB()))
                .sessionId(session != null ? session.getId() : null)
                .topic(conversation.getTopic())
                .startedAt(conversation.getStartedAt())
                .endedAt(conversation.getEndedAt())
                .durationSeconds(conversation.getDurationSeconds())
                .status(conversation.getStatus())
                .hasRecordingA(conversation.getRecordingUrlA() != null)
                .hasRecordingB(conversation.getRecordingUrlB() != null)
                .createdAt(conversation.getCreatedAt())
                .callDurationSeconds(session != null ? session.getCallDurationSeconds() : 600)
                .breakDurationSeconds(session != null ? session.getBreakDurationSeconds() : 30)
                .hasTranscript(transcript != null)
                .transcriptId(transcript != null ? transcript.getId() : null)
                .build();
    }

    @Builder
    public record UserSummary(
            UUID id,
            String name,
            String avatarUrl
    ) {
        public static UserSummary from(com.speakup.domain.user.User user) {
            return UserSummary.builder()
                    .id(user.getId())
                    .name(user.getName())
                    .avatarUrl(user.getAvatarUrl())
                    .build();
        }
    }
}
