package com.speakup.application.feedback.dto;

/**
 * DTO for feedback statistics.
 */
public record FeedbackStatsDTO(
        long total,
        long open,
        long inProgress,
        long resolved,
        long closed,
        long bugs,
        long suggestions,
        long other
) {
}
