package com.speakup.application.auth.dto;

/**
 * Response containing authentication tokens and user info.
 */
public record AuthResponse(
        String accessToken,
        String refreshToken,
        UserResponse user
) {}
