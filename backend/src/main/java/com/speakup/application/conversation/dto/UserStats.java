package com.speakup.application.conversation.dto;

import lombok.Builder;

/**
 * User statistics DTO.
 */
@Builder
public record UserStats(
        long totalConversations,
        long totalDurationSeconds,
        long totalDurationMinutes,
        long averageDurationSeconds,
        long conversationsThisWeek,
        long conversationsThisMonth
) {
}
