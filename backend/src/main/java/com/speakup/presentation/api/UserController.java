package com.speakup.presentation.api;

import com.speakup.application.user.UserService;
import com.speakup.application.user.dto.CompleteProfileRequest;
import com.speakup.application.user.dto.UserResponse;
import com.speakup.presentation.api.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import com.speakup.infrastructure.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * REST controller for user operations.
 */
@RestController
@RequestMapping("/api/v1/users")
@RequiredArgsConstructor
@Tag(name = "Users", description = "User management endpoints")
public class UserController {

    private final UserService userService;

    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID")
    public ResponseEntity<ApiResponse<UserResponse>> getUser(@PathVariable UUID id) {
        UserResponse user = userService.getUser(id);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PutMapping("/{id}/profile")
    @Operation(summary = "Complete user profile by ID")
    public ResponseEntity<ApiResponse<UserResponse>> completeProfileById(
            @PathVariable UUID id,
            @Valid @RequestBody CompleteProfileRequest request
    ) {
        UserResponse user = userService.completeProfile(id, request);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PutMapping("/profile")
    @Operation(summary = "Complete current user profile", description = "Updates profile for the authenticated user")
    public ResponseEntity<ApiResponse<UserResponse>> completeProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody CompleteProfileRequest request
    ) {
        if (principal == null) {
            return ResponseEntity.status(401).build();
        }
        UserResponse user = userService.completeProfile(principal.getId(), request);
        return ResponseEntity.ok(ApiResponse.success(user));
    }
}
