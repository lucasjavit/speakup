package com.speakup.application.admin.dto;

/**
 * Response containing dashboard statistics.
 */
public record DashboardStatsResponse(
        long totalUsers,
        long activeUsers,
        long totalSessions,
        long activeSessions,
        long currentlyRunningSessions
) {
}
