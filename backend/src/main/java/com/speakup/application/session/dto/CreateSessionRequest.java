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
 * Request to create a new session.
 */
public record CreateSessionRequest(
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

        @Min(value = 10, message = "Call duration must be at least 10 seconds")
        @Max(value = 1800, message = "Call duration must be at most 1800 seconds (30 minutes)")
        Integer callDurationSeconds,

        @Min(value = 0, message = "Break duration must be at least 0 seconds")
        @Max(value = 300, message = "Break duration must be at most 300 seconds (5 minutes)")
        Integer breakDurationSeconds
) {
    /**
     * Returns the call duration, defaulting to 600 seconds (10 minutes) if not specified.
     */
    public Integer callDurationSecondsOrDefault() {
        return callDurationSeconds != null ? callDurationSeconds : 600;
    }

    /**
     * Returns the break duration, defaulting to 30 seconds if not specified.
     */
    public Integer breakDurationSecondsOrDefault() {
        return breakDurationSeconds != null ? breakDurationSeconds : 30;
    }
}
