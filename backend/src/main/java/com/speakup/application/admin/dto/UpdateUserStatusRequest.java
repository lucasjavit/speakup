package com.speakup.application.admin.dto;

import jakarta.validation.constraints.NotNull;

/**
 * Request to update a user's active status.
 */
public record UpdateUserStatusRequest(
        @NotNull(message = "Active status is required")
        Boolean active
) {
}
