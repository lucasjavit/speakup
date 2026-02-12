package com.speakup.application.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import java.util.List;
import java.util.UUID;

/**
 * Request to send email from admin panel.
 * If userIds is null or empty, sends to all active users.
 */
public record SendEmailRequest(
        @NotBlank(message = "Subject is required")
        @Size(max = 200, message = "Subject must not exceed 200 characters")
        String subject,

        @NotBlank(message = "Body is required")
        @Size(max = 10000, message = "Body must not exceed 10000 characters")
        String body,

        List<UUID> userIds
) {
}
