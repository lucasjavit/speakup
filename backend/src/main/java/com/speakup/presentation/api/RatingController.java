package com.speakup.presentation.api;

import com.speakup.application.rating.RatingService;
import com.speakup.application.rating.dto.RatingResponse;
import com.speakup.application.rating.dto.SubmitRatingRequest;
import com.speakup.infrastructure.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * REST controller for rating operations.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/ratings")
@RequiredArgsConstructor
@Tag(name = "Ratings", description = "Rating management endpoints")
public class RatingController {

    private final RatingService ratingService;

    @PostMapping
    @Operation(summary = "Submit rating", description = "Submit a rating for a conversation")
    public ResponseEntity<RatingResponse> submitRating(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody SubmitRatingRequest request) {

        try {
            RatingResponse response = ratingService.submitRating(principal.getId(), request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Failed to submit rating: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/conversation/{conversationId}")
    @Operation(summary = "Get rating for conversation", description = "Get the user's rating for a specific conversation")
    public ResponseEntity<RatingResponse> getRatingForConversation(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID conversationId) {

        return ratingService.getRatingForConversation(conversationId, principal.getId())
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/conversation/{conversationId}/exists")
    @Operation(summary = "Check if rated", description = "Check if user has already rated a conversation")
    public ResponseEntity<Boolean> hasUserRated(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID conversationId) {

        boolean hasRated = ratingService.hasUserRated(conversationId, principal.getId());
        return ResponseEntity.ok(hasRated);
    }
}
