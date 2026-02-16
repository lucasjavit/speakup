package com.speakup.application.feedback.dto;

import com.speakup.domain.feedback.FeedbackStatus;
import jakarta.validation.constraints.NotNull;

/**
 * Request to update feedback status.
 */
public record UpdateFeedbackStatusRequest(
        @NotNull(message = "Status is required")
        FeedbackStatus status
) {
}
