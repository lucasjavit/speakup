package com.speakup.presentation.api.admin;

import com.speakup.application.admin.AdminFeedbackService;
import com.speakup.application.feedback.dto.FeedbackDTO;
import com.speakup.application.feedback.dto.FeedbackStatsDTO;
import com.speakup.application.feedback.dto.FeedbackSummaryDTO;
import com.speakup.application.feedback.dto.UpdateAdminNotesRequest;
import com.speakup.application.feedback.dto.UpdateFeedbackStatusRequest;
import com.speakup.domain.feedback.FeedbackStatus;
import com.speakup.domain.feedback.FeedbackType;
import com.speakup.infrastructure.security.UserPrincipal;
import com.speakup.presentation.api.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * Admin controller for managing feedbacks.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/admin/feedbacks")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'MODERATOR', 'SUPER_ADMIN')")
@Tag(name = "Admin - Feedbacks", description = "Feedback management endpoints for administrators")
public class AdminFeedbackController {

    private final AdminFeedbackService adminFeedbackService;

    @GetMapping
    @Operation(summary = "List all feedbacks", description = "Returns all feedbacks with optional filters and pagination")
    public ResponseEntity<ApiResponse<Page<FeedbackSummaryDTO>>> listFeedbacks(
            @RequestParam(required = false) FeedbackStatus status,
            @RequestParam(required = false) FeedbackType type,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
        
        Page<FeedbackSummaryDTO> feedbacks = adminFeedbackService.getAllFeedbacks(status, type, pageable);
        return ResponseEntity.ok(ApiResponse.success(feedbacks));
    }

    @GetMapping("/stats")
    @Operation(summary = "Get feedback statistics", description = "Returns feedback statistics (totals by status and type)")
    public ResponseEntity<ApiResponse<FeedbackStatsDTO>> getFeedbackStats() {
        FeedbackStatsDTO stats = adminFeedbackService.getFeedbackStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get feedback by ID", description = "Returns detailed feedback information")
    public ResponseEntity<ApiResponse<FeedbackDTO>> getFeedback(@PathVariable UUID id) {
        try {
            FeedbackDTO feedback = adminFeedbackService.getFeedback(id);
            return ResponseEntity.ok(ApiResponse.success(feedback));
        } catch (IllegalArgumentException e) {
            log.warn("Failed to get feedback: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }

    @PatchMapping("/{id}/status")
    @Operation(summary = "Update feedback status", description = "Updates the status of a feedback")
    public ResponseEntity<ApiResponse<FeedbackDTO>> updateFeedbackStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateFeedbackStatusRequest request,
            @AuthenticationPrincipal UserPrincipal principal) {
        
        try {
            FeedbackDTO feedback = adminFeedbackService.updateFeedbackStatus(id, request, principal);
            return ResponseEntity.ok(ApiResponse.success(feedback));
        } catch (IllegalArgumentException e) {
            log.warn("Failed to update feedback status: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @PatchMapping("/{id}/notes")
    @Operation(summary = "Update admin notes", description = "Adds or updates admin notes for a feedback")
    public ResponseEntity<ApiResponse<FeedbackDTO>> updateAdminNotes(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateAdminNotesRequest request) {
        
        try {
            FeedbackDTO feedback = adminFeedbackService.updateAdminNotes(id, request);
            return ResponseEntity.ok(ApiResponse.success(feedback));
        } catch (IllegalArgumentException e) {
            log.warn("Failed to update admin notes: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('SUPER_ADMIN')")
    @Operation(summary = "Delete feedback", description = "Deletes a feedback (SUPER_ADMIN only)")
    public ResponseEntity<ApiResponse<Void>> deleteFeedback(@PathVariable UUID id) {
        try {
            adminFeedbackService.deleteFeedback(id);
            return ResponseEntity.ok(ApiResponse.success(null));
        } catch (IllegalArgumentException e) {
            log.warn("Failed to delete feedback: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
}
