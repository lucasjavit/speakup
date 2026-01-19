package com.speakup.application.session.dto;

import com.speakup.domain.session.Session;
import com.speakup.domain.session.SessionStatus;

import java.time.DayOfWeek;
import java.time.Instant;
import java.time.LocalTime;
import java.util.Set;
import java.util.UUID;

/**
 * Response containing session information.
 */
public record SessionResponse(
        UUID id,
        String name,
        LocalTime startTime,
        LocalTime endTime,
        String timezone,
        Set<DayOfWeek> daysOfWeek,
        SessionStatus status,
        boolean currentlyRunning,
        Integer callDurationSeconds,
        Instant createdAt,
        Instant updatedAt
) {
    public static SessionResponse from(Session session) {
        return new SessionResponse(
                session.getId(),
                session.getName(),
                session.getStartTime(),
                session.getEndTime(),
                session.getTimezone(),
                session.getDaysOfWeekSet(),
                session.getStatus(),
                session.isCurrentlyRunning(),
                session.getCallDurationSeconds(),
                session.getCreatedAt(),
                session.getUpdatedAt()
        );
    }
}
