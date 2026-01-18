package com.speakup.application.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request containing Google ID Token from frontend.
 */
public record GoogleAuthRequest(
        @NotBlank(message = "ID Token is required")
        String idToken
) {}
