package com.speakup.presentation.api;

import com.speakup.application.conversation.TranscriptService;
import com.speakup.application.conversation.dto.*;
import com.speakup.application.settings.SettingsService;
import com.speakup.infrastructure.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import com.speakup.presentation.api.response.ApiResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST controller for conversation transcript operations.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/transcripts")
@RequiredArgsConstructor
@Tag(name = "Transcripts", description = "Conversation transcript management endpoints")
public class TranscriptController {

    private final TranscriptService transcriptService;
    private final SettingsService settingsService;

    @PostMapping
    @Operation(summary = "Save transcript", description = "Save a conversation transcript with optional AI analysis")
    public ResponseEntity<?> saveTranscript(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SaveTranscriptRequest request) {

        if (!settingsService.isTranscriptFeatureEnabled()) {
            log.warn("Transcript feature is disabled");
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("FEATURE_DISABLED", "Transcript feature is currently disabled"));
        }

        try {
            TranscriptDTO transcript = transcriptService.saveTranscript(
                    request.conversationId(),
                    principal.getId(),
                    request.transcriptData(),
                    request.includeAnalysis()
            );
            return ResponseEntity.status(HttpStatus.CREATED).body(transcript);
        } catch (IllegalStateException e) {
            log.warn("Quota exceeded for user {}: {}", principal.getId(), e.getMessage());
            return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).build();
        } catch (IllegalArgumentException e) {
            log.warn("Invalid request for user {}: {}", principal.getId(), e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping
    @Operation(summary = "Get user transcripts", description = "Get paginated list of user's conversation transcripts")
    public ResponseEntity<?> getTranscripts(
            @AuthenticationPrincipal UserPrincipal principal,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        if (!settingsService.isTranscriptFeatureEnabled()) {
            log.warn("Transcript feature is disabled");
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("FEATURE_DISABLED", "Transcript feature is currently disabled"));
        }

        Page<TranscriptSummaryDTO> transcripts = transcriptService.getUserTranscripts(
                principal.getId(), pageable);
        return ResponseEntity.ok(transcripts);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get transcript details", description = "Get detailed transcript with analysis if available")
    public ResponseEntity<?> getTranscriptDetails(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {

        if (!settingsService.isTranscriptFeatureEnabled()) {
            log.warn("Transcript feature is disabled");
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("FEATURE_DISABLED", "Transcript feature is currently disabled"));
        }

        try {
            TranscriptWithAnalysisDTO transcript = transcriptService.getTranscriptDetails(id, principal.getId());
            return ResponseEntity.ok(transcript);
        } catch (IllegalArgumentException e) {
            log.warn("Transcript access denied for user {}: {}", principal.getId(), e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{id}/analyze")
    @Operation(summary = "Request AI analysis", description = "Trigger AI analysis for an existing transcript")
    public ResponseEntity<?> requestAnalysis(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {

        if (!settingsService.isTranscriptFeatureEnabled()) {
            log.warn("Transcript feature is disabled");
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("FEATURE_DISABLED", "Transcript feature is currently disabled"));
        }

        try {
            TranscriptDTO transcript = transcriptService.requestAnalysis(id, principal.getId());
            return ResponseEntity.ok(transcript);
        } catch (IllegalStateException e) {
            log.warn("Analysis request failed for user {}: {}", principal.getId(), e.getMessage());
            return ResponseEntity.status(HttpStatus.CONFLICT).body(ApiResponse.error("ANALYSIS_CONFLICT", e.getMessage()));
        } catch (IllegalArgumentException e) {
            log.warn("Invalid analysis request for user {}: {}", principal.getId(), e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/quota")
    @Operation(summary = "Get transcript quota", description = "Get user's remaining transcript quota for today")
    public ResponseEntity<?> getQuota(
            @AuthenticationPrincipal UserPrincipal principal) {

        if (!settingsService.isTranscriptFeatureEnabled()) {
            log.warn("Transcript feature is disabled");
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("FEATURE_DISABLED", "Transcript feature is currently disabled"));
        }

        TranscriptQuotaDTO quota = transcriptService.getQuota(principal.getId());
        return ResponseEntity.ok(quota);
    }

    @GetMapping("/feature-status")
    @Operation(summary = "Get transcript feature status", description = "Check if transcript feature is enabled")
    public ResponseEntity<ApiResponse<java.util.Map<String, Boolean>>> getFeatureStatus() {
        boolean enabled = settingsService.isTranscriptFeatureEnabled();
        return ResponseEntity.ok(ApiResponse.success(java.util.Map.of("enabled", enabled)));
    }
}
