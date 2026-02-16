package com.speakup.application.feedback.dto;

import jakarta.validation.constraints.Size;

/**
 * Request to update admin notes.
 */
public record UpdateAdminNotesRequest(
        @Size(max = 5000, message = "Admin notes must not exceed 5000 characters")
        String notes
) {
}
