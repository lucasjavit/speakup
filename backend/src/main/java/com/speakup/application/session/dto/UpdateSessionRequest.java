package com.speakup.application.session.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.util.Set;

/**
 * Request to update an existing session.
 */
public record UpdateSessionRequest(
        @NotBlank(message = "Name is required")
        String name,

        @NotNull(message = "Start time is required")
        LocalTime startTime,

        @NotNull(message = "End time is required")
        LocalTime endTime,

        @NotBlank(message = "Timezone is required")
        String timezone,

        @NotEmpty(message = "At least one day of week is required")
        Set<DayOfWeek> daysOfWeek,

        @Min(value = 60, message = "Call duration must be at least 60 seconds")
        @Max(value = 3600, message = "Call duration must be at most 3600 seconds (1 hour)")
        Integer callDurationSeconds,

        @Min(value = 0, message = "Break duration must be at least 0 seconds")
        @Max(value = 300, message = "Break duration must be at most 300 seconds (5 minutes)")
        Integer breakDurationSeconds
) {
}
