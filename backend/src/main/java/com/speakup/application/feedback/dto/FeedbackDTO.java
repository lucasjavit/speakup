package com.speakup.application.feedback.dto;

import com.speakup.domain.feedback.Feedback;
import com.speakup.domain.feedback.FeedbackStatus;
import com.speakup.domain.feedback.FeedbackType;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO for feedback details.
 */
public record FeedbackDTO(
        UUID id,
        UUID userId,
        String userEmail,
        String userName,
        FeedbackType type,
        String title,
        String description,
        String screenshotUrl,
        String screenshotData,
        String pageUrl,
        String userAgent,
        FeedbackStatus status,
        String adminNotes,
        Instant resolvedAt,
        UUID resolvedBy,
        Instant createdAt,
        Instant updatedAt
) {
    /**
     * Create a FeedbackDTO from a Feedback entity.
     */
    public static FeedbackDTO from(Feedback feedback) {
        return new FeedbackDTO(
                feedback.getId(),
                feedback.getUser() != null ? feedback.getUser().getId() : null,
                feedback.getUserEmail(),
                feedback.getUserName(),
                feedback.getType(),
                feedback.getTitle(),
                feedback.getDescription(),
                feedback.getScreenshotUrl(),
                feedback.getScreenshotData(),
                feedback.getPageUrl(),
                feedback.getUserAgent(),
                feedback.getStatus(),
                feedback.getAdminNotes(),
                feedback.getResolvedAt(),
                feedback.getResolvedBy(),
                feedback.getCreatedAt(),
                feedback.getUpdatedAt()
        );
    }
}
