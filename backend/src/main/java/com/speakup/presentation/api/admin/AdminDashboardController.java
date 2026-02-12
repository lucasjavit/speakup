package com.speakup.presentation.api.admin;

import com.speakup.application.admin.AdminUserService;
import com.speakup.application.admin.dto.DashboardStatsResponse;
import com.speakup.application.presence.PresenceService;
import com.speakup.application.session.SessionService;
import com.speakup.presentation.api.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Admin controller for dashboard statistics.
 */
@RestController
@RequestMapping("/api/v1/admin/dashboard")
@RequiredArgsConstructor
@Tag(name = "Admin - Dashboard", description = "Dashboard statistics endpoints for administrators")
public class AdminDashboardController {

    private final AdminUserService adminUserService;
    private final SessionService sessionService;
    private final PresenceService presenceService;

    @GetMapping("/stats")
    @Operation(summary = "Get dashboard statistics", description = "Returns overview statistics for the admin dashboard")
    public ResponseEntity<ApiResponse<DashboardStatsResponse>> getStats() {
        DashboardStatsResponse stats = new DashboardStatsResponse(
                adminUserService.count(),
                adminUserService.countActive(),
                presenceService.countOnline(),
                sessionService.count(),
                sessionService.countActive(),
                sessionService.findCurrentlyRunningSessions().size()
        );
        return ResponseEntity.ok(ApiResponse.success(stats));
    }
}
