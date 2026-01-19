package com.speakup.presentation.api;

import com.speakup.application.relationship.UserRelationshipService;
import com.speakup.application.relationship.dto.BlockUserRequest;
import com.speakup.application.relationship.dto.FavoriteUserResponse;
import com.speakup.application.relationship.dto.RelationshipResponse;
import com.speakup.infrastructure.security.UserPrincipal;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

/**
 * REST controller for user relationship operations.
 */
@Slf4j
@RestController
@RequestMapping("/api/v1/relationships")
@RequiredArgsConstructor
@Tag(name = "Relationships", description = "User relationship management endpoints")
public class UserRelationshipController {

    private final UserRelationshipService relationshipService;

    @PostMapping("/block")
    @Operation(summary = "Block user", description = "Block a user from being matched with you")
    public ResponseEntity<RelationshipResponse> blockUser(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody BlockUserRequest request) {

        try {
            RelationshipResponse response = relationshipService.blockUser(principal.getId(), request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            log.warn("Failed to block user: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @DeleteMapping("/block/{userId}")
    @Operation(summary = "Unblock user", description = "Unblock a previously blocked user")
    public ResponseEntity<Void> unblockUser(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID userId) {

        try {
            relationshipService.unblockUser(principal.getId(), userId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            log.warn("Failed to unblock user: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/favorites")
    @Operation(summary = "Get favorites", description = "Get all favorited users")
    public ResponseEntity<List<FavoriteUserResponse>> getFavorites(
            @AuthenticationPrincipal UserPrincipal principal) {

        List<FavoriteUserResponse> favorites = relationshipService.getFavorites(principal.getId());
        return ResponseEntity.ok(favorites);
    }

    @GetMapping("/favorites/mutual")
    @Operation(summary = "Get mutual favorites", description = "Get users where both have favorited each other")
    public ResponseEntity<List<FavoriteUserResponse>> getMutualFavorites(
            @AuthenticationPrincipal UserPrincipal principal) {

        List<FavoriteUserResponse> mutualFavorites = relationshipService.getMutualFavorites(principal.getId());
        return ResponseEntity.ok(mutualFavorites);
    }

    @DeleteMapping("/favorites/{userId}")
    @Operation(summary = "Remove favorite", description = "Remove a user from favorites")
    public ResponseEntity<Void> removeFavorite(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID userId) {

        try {
            relationshipService.removeFavorite(principal.getId(), userId);
            return ResponseEntity.noContent().build();
        } catch (IllegalArgumentException e) {
            log.warn("Failed to remove favorite: {}", e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }

    @GetMapping("/blocked/{userId}")
    @Operation(summary = "Check if blocked", description = "Check if user is blocked (either direction)")
    public ResponseEntity<Boolean> isBlocked(
            @AuthenticationPrincipal UserPrincipal principal,
            @PathVariable UUID userId) {

        boolean isBlocked = relationshipService.isBlocked(principal.getId(), userId);
        return ResponseEntity.ok(isBlocked);
    }
}
