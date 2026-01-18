package com.speakup.application.admin.dto;

import com.speakup.domain.user.Role;
import jakarta.validation.constraints.NotNull;

/**
 * Request to update a user's role.
 */
public record UpdateUserRoleRequest(
        @NotNull(message = "Role is required")
        Role role
) {
}
