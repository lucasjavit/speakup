package com.speakup.presentation.api;

import com.speakup.application.session.SessionService;
import com.speakup.application.session.dto.SessionResponse;
import com.speakup.presentation.api.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Public controller for accessing session information.
 * Available to all authenticated users.
 */
@RestController
@RequestMapping("/api/v1/sessions")
@RequiredArgsConstructor
@Tag(name = "Sessions", description = "Public session endpoints for users")
public class SessionController {

    private final SessionService sessionService;

    @GetMapping("/active")
    @Operation(summary = "List active sessions", description = "Returns all active sessions available for joining")
    public ResponseEntity<ApiResponse<List<SessionResponse>>> listActiveSessions() {
        List<SessionResponse> sessions = sessionService.findActiveSessions();
        return ResponseEntity.ok(ApiResponse.success(sessions));
    }

    @GetMapping("/running")
    @Operation(summary = "List currently running sessions", description = "Returns sessions that are currently in progress and can be joined")
    public ResponseEntity<ApiResponse<List<SessionResponse>>> listRunningSessions() {
        List<SessionResponse> sessions = sessionService.findCurrentlyRunningSessions();
        return ResponseEntity.ok(ApiResponse.success(sessions));
    }
}
