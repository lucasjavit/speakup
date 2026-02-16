package com.speakup.application.feedback.dto;

import com.speakup.domain.feedback.FeedbackType;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Request to create a new feedback.
 */
public record CreateFeedbackRequest(
        @NotNull(message = "Feedback type is required")
        FeedbackType type,

        @NotBlank(message = "Title is required")
        @Size(max = 255, message = "Title must not exceed 255 characters")
        String title,

        @NotBlank(message = "Description is required")
        @Size(max = 5000, message = "Description must not exceed 5000 characters")
        String description,

        String screenshotData,

        @Size(max = 1000, message = "Page URL must not exceed 1000 characters")
        String pageUrl,

        @Size(max = 500, message = "User agent must not exceed 500 characters")
        String userAgent
) {
}
