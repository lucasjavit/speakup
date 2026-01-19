package com.speakup.application.conversation.dto;

import com.speakup.domain.conversation.Conversation;
import com.speakup.domain.conversation.ConversationStatus;
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
        Instant createdAt
) {

    public static ConversationResponse from(Conversation conversation) {
        return ConversationResponse.builder()
                .id(conversation.getId())
                .userA(UserSummary.from(conversation.getUserA()))
                .userB(UserSummary.from(conversation.getUserB()))
                .sessionId(conversation.getSession() != null ? conversation.getSession().getId() : null)
                .topic(conversation.getTopic())
                .startedAt(conversation.getStartedAt())
                .endedAt(conversation.getEndedAt())
                .durationSeconds(conversation.getDurationSeconds())
                .status(conversation.getStatus())
                .hasRecordingA(conversation.getRecordingUrlA() != null)
                .hasRecordingB(conversation.getRecordingUrlB() != null)
                .createdAt(conversation.getCreatedAt())
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
