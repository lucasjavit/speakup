package com.speakup.application.session.dto;

import com.speakup.domain.session.SessionStatus;
import jakarta.validation.constraints.NotNull;

/**
 * Request to update session status.
 */
public record UpdateSessionStatusRequest(
        @NotNull(message = "Status is required")
        SessionStatus status
) {
}
