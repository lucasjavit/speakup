package com.speakup.presentation.api.admin;

import com.speakup.application.admin.AdminUserService;
import com.speakup.application.admin.dto.AdminUserResponse;
import com.speakup.application.admin.dto.UpdateUserRoleRequest;
import com.speakup.application.admin.dto.UpdateUserStatusRequest;
import com.speakup.presentation.api.response.ApiResponse;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.UUID;

/**
 * Admin controller for managing users.
 */
@RestController
@RequestMapping("/api/v1/admin/users")
@RequiredArgsConstructor
@Tag(name = "Admin - Users", description = "User management endpoints for administrators")
public class AdminUserController {

    private final AdminUserService adminUserService;

    @GetMapping
    @Operation(summary = "List all users", description = "Returns all users with pagination")
    public ResponseEntity<ApiResponse<Page<AdminUserResponse>>> listUsers(
            @RequestParam(required = false) String search,
            Pageable pageable) {
        Page<AdminUserResponse> users;
        if (search != null && !search.isBlank()) {
            users = adminUserService.search(search, pageable);
        } else {
            users = adminUserService.findAll(pageable);
        }
        return ResponseEntity.ok(ApiResponse.success(users));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get user by ID", description = "Returns a specific user")
    public ResponseEntity<ApiResponse<AdminUserResponse>> getUser(@PathVariable UUID id) {
        AdminUserResponse user = adminUserService.findById(id);
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PatchMapping("/{id}/role")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    @Operation(summary = "Update user role", description = "Updates a user's role (SUPER_ADMIN only)")
    public ResponseEntity<ApiResponse<AdminUserResponse>> updateUserRole(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserRoleRequest request) {
        AdminUserResponse user = adminUserService.updateRole(id, request.role());
        return ResponseEntity.ok(ApiResponse.success(user));
    }

    @PatchMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('MODERATOR', 'SUPER_ADMIN')")
    @Operation(summary = "Update user status", description = "Activates or deactivates a user")
    public ResponseEntity<ApiResponse<AdminUserResponse>> updateUserStatus(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateUserStatusRequest request) {
        AdminUserResponse user = adminUserService.updateStatus(id, request.active());
        return ResponseEntity.ok(ApiResponse.success(user));
    }
}
