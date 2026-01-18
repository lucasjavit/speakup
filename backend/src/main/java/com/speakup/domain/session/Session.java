package com.speakup.domain.session;

import com.speakup.domain.shared.BaseEntity;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.Index;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.DayOfWeek;
import java.time.LocalTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Set;

/**
 * Represents a recurring practice session period.
 * Sessions are time slots (e.g., 7:00-8:00) that can occur on specific days of the week.
 */
@Entity
@Table(name = "sessions", indexes = {
    @Index(name = "idx_session_status", columnList = "status")
})
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Session extends BaseEntity {

    @Column(nullable = false)
    private String name;

    @Column(nullable = false)
    private LocalTime startTime;

    @Column(nullable = false)
    private LocalTime endTime;

    @Column(nullable = false)
    private String timezone;

    /**
     * Days of the week when this session occurs.
     * Stored as comma-separated values (e.g., "MONDAY,WEDNESDAY,FRIDAY").
     */
    @Column(nullable = false)
    private String daysOfWeek;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private SessionStatus status = SessionStatus.ACTIVE;

    /**
     * Check if the session is currently active (within time range).
     */
    public boolean isCurrentlyRunning() {
        if (status != SessionStatus.ACTIVE) {
            return false;
        }

        ZonedDateTime now = ZonedDateTime.now(ZoneId.of(timezone));
        LocalTime currentTime = now.toLocalTime();
        DayOfWeek currentDay = now.getDayOfWeek();

        return getDaysOfWeekSet().contains(currentDay)
                && !currentTime.isBefore(startTime)
                && currentTime.isBefore(endTime);
    }

    /**
     * Parse days of week string to Set.
     */
    public Set<DayOfWeek> getDaysOfWeekSet() {
        if (daysOfWeek == null || daysOfWeek.isBlank()) {
            return Set.of();
        }
        return Set.of(daysOfWeek.split(","))
                .stream()
                .map(String::trim)
                .map(DayOfWeek::valueOf)
                .collect(java.util.stream.Collectors.toSet());
    }

    /**
     * Set days of week from a Set.
     */
    public void setDaysOfWeekSet(Set<DayOfWeek> days) {
        this.daysOfWeek = days.stream()
                .map(DayOfWeek::name)
                .collect(java.util.stream.Collectors.joining(","));
    }

    /**
     * Activate this session.
     */
    public void activate() {
        this.status = SessionStatus.ACTIVE;
    }

    /**
     * Deactivate this session.
     */
    public void deactivate() {
        this.status = SessionStatus.INACTIVE;
    }
}
