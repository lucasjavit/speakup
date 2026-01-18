package com.speakup.application.auth.dto;

import jakarta.validation.constraints.NotBlank;

/**
 * Request for refreshing access token.
 */
public record RefreshTokenRequest(
        @NotBlank(message = "Refresh token is required")
        String refreshToken
) {}
