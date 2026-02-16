package com.speakup.application.feedback.dto;

import com.speakup.domain.feedback.Feedback;
import com.speakup.domain.feedback.FeedbackStatus;
import com.speakup.domain.feedback.FeedbackType;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO for feedback summary (for listing).
 */
public record FeedbackSummaryDTO(
        UUID id,
        UUID userId,
        String userEmail,
        String userName,
        FeedbackType type,
        String title,
        FeedbackStatus status,
        boolean hasScreenshot,
        Instant createdAt
) {
    /**
     * Create a FeedbackSummaryDTO from a Feedback entity.
     */
    public static FeedbackSummaryDTO from(Feedback feedback) {
        return new FeedbackSummaryDTO(
                feedback.getId(),
                feedback.getUser() != null ? feedback.getUser().getId() : null,
                feedback.getUserEmail(),
                feedback.getUserName(),
                feedback.getType(),
                feedback.getTitle(),
                feedback.getStatus(),
                feedback.getScreenshotData() != null || feedback.getScreenshotUrl() != null,
                feedback.getCreatedAt()
        );
    }
}
