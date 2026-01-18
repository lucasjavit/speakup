package com.speakup.presentation.api.admin;

import com.speakup.application.session.SessionService;
import com.speakup.application.session.dto.CreateSessionRequest;
import com.speakup.application.session.dto.SessionResponse;
import com.speakup.application.session.dto.UpdateSessionRequest;
import com.speakup.application.session.dto.UpdateSessionStatusRequest;
import com.speakup.presentation.api.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * Admin controller for managing practice sessions.
 */
@RestController
@RequestMapping("/api/v1/admin/sessions")
@RequiredArgsConstructor
@Tag(name = "Admin - Sessions", description = "Session management endpoints for administrators")
public class AdminSessionController {

    private final SessionService sessionService;

    @GetMapping
    @Operation(summary = "List all sessions", description = "Returns all sessions with pagination")
    public ResponseEntity<ApiResponse<Page<SessionResponse>>> listSessions(Pageable pageable) {
        Page<SessionResponse> sessions = sessionService.findAll(pageable);
        return ResponseEntity.ok(ApiResponse.success(sessions));
    }

    @GetMapping("/all")
    @Operation(summary = "List all sessions without pagination", description = "Returns all sessions")
    public ResponseEntity<ApiResponse<List<SessionResponse>>> listAllSessions() {
        List<SessionResponse> sessions = sessionService.findAll();
        return ResponseEntity.ok(ApiResponse.success(sessions));
    }

    @GetMapping("/active")
    @Operation(summary = "List active sessions", description = "Returns only active sessions")
    public ResponseEntity<ApiResponse<List<SessionResponse>>> listActiveSessions() {
        List<SessionResponse> sessions = sessionService.findActiveSessions();
        return ResponseEntity.ok(ApiResponse.success(sessions));
    }

    @GetMapping("/running")
    @Operation(summary = "List currently running sessions", description = "Returns sessions that are currently in progress")
    public ResponseEntity<ApiResponse<List<SessionResponse>>> listRunningSessions() {
        List<SessionResponse> sessions = sessionService.findCurrentlyRunningSessions();
        return ResponseEntity.ok(ApiResponse.success(sessions));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get session by ID", description = "Returns a specific session")
    public ResponseEntity<ApiResponse<SessionResponse>> getSession(@PathVariable UUID id) {
        SessionResponse session = sessionService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(session));
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('MODERATOR', 'SUPER_ADMIN')")
    @Operation(summary = "Create session", description = "Creates a new practice session")
    public ResponseEntity<ApiResponse<SessionResponse>> createSession(
            @Valid @RequestBody CreateSessionRequest request) {
        SessionResponse session = sessionService.create(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(ApiResponse.success(session));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('MODERATOR', 'SUPER_ADMIN')")
    @Operation(summary = "Update session", description = "Updates an existing session")
    public ResponseEntity<ApiResponse<SessionResponse>> updateSession(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateSessionRequest request) {
        SessionResponse session = sessionService.update(id, request);
        return ResponseEntity.ok(ApiResponse.success(session));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('MODERATOR', 'SUPER_ADMIN')")
    @Operation(summary = "Update session status", description = "Activates or deactivates a session")
    public ResponseEntity<ApiResponse<SessionResponse>> updateSessionStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateSessionStatusRequest request) {
        SessionResponse session = sessionService.updateStatus(id, request.status());
        return ResponseEntity.ok(ApiResponse.success(session));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('MODERATOR', 'SUPER_ADMIN')")
    @Operation(summary = "Delete session", description = "Deletes a session")
    public ResponseEntity<Void> deleteSession(@PathVariable UUID id) {
        sessionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
