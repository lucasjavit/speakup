package com.speakup.presentation.api;

import com.speakup.application.presence.PresenceService;
import com.speakup.infrastructure.security.UserPrincipal;
import com.speakup.presentation.api.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

/**
 * Controller for presence/online count. Any authenticated user can read the count (excluding themselves).
 */
@RestController
@RequestMapping("/api/v1/presence")
@RequiredArgsConstructor
@Tag(name = "Presence", description = "Online users count for dashboard")
public class PresenceController {

    private final PresenceService presenceService;

    @GetMapping("/count")
    @Operation(summary = "Get online users count", description = "Returns how many other users are currently online (excluding the current user).")
    public ResponseEntity<ApiResponse<Map<String, Long>>> getOnlineCount(
            @AuthenticationPrincipal UserPrincipal principal) {
        long count = principal != null
                ? presenceService.countOnlineExcluding(principal.getId())
                : presenceService.countOnline();
        return ResponseEntity.ok(ApiResponse.success(Map.of("onlineUsers", count)));
    }
}
