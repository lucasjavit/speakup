package com.speakup.application.admin.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.time.Instant;
import java.util.List;
import java.util.UUID;

public record ScheduleEmailRequest(
        @NotBlank(message = "Subject is required")
        @Size(max = 200, message = "Subject must not exceed 200 characters")
        String subject,

        @NotBlank(message = "Body is required")
        @Size(max = 10000, message = "Body must not exceed 10000 characters")
        String body,

        @NotNull(message = "Scheduled time is required")
        Instant scheduledAt,

        List<UUID> userIds
) {
}
