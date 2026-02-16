package com.speakup.presentation.api;

import com.speakup.application.feedback.FeedbackService;
import com.speakup.application.feedback.dto.CreateFeedbackRequest;
import com.speakup.application.feedback.dto.FeedbackDTO;
import com.speakup.application.feedback.dto.FeedbackSummaryDTO;
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
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

/**
 * REST controller for feedback operations.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/feedbacks")
@RequiredArgsConstructor
@Tag(name = "Feedbacks", description = "Feedback management endpoints")
public class FeedbackController {

    private final FeedbackService feedbackService;

    @PostMapping
    @Operation(summary = "Create feedback", description = "Create a new feedback (bug report or suggestion)")
    public ResponseEntity<FeedbackDTO> createFeedback(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CreateFeedbackRequest request) {

        try {
            FeedbackDTO feedback = feedbackService.createFeedback(request, principal);
            return ResponseEntity.ok(feedback);
        } catch (IllegalArgumentException e) {
            log.warn("Failed to create feedback: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/me")
    @Operation(summary = "Get my feedbacks", description = "Get all feedbacks created by the authenticated user")
    public ResponseEntity<Page<FeedbackSummaryDTO>> getMyFeedbacks(
            @AuthenticationPrincipal UserPrincipal principal,
            @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {

        Page<FeedbackSummaryDTO> feedbacks = feedbackService.getUserFeedbacks(principal, pageable);
        return ResponseEntity.ok(feedbacks);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get feedback", description = "Get feedback details (users can only see their own feedbacks)")
    public ResponseEntity<FeedbackDTO> getFeedback(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID id) {

        try {
            FeedbackDTO feedback = feedbackService.getFeedback(id, principal);
            return ResponseEntity.ok(feedback);
        } catch (IllegalArgumentException e) {
            log.warn("Failed to get feedback: {}", e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
}
