package com.speakup.application.auth.dto;

import com.speakup.domain.user.AuthProvider;
import com.speakup.domain.user.Language;
import com.speakup.domain.user.ProficiencyLevel;
import com.speakup.domain.user.User;

import java.util.UUID;

/**
 * Response containing user information.
 */
public record UserResponse(
        UUID id,
        String email,
        String name,
        String avatarUrl,
        AuthProvider provider,
        Language nativeLanguage,
        Language targetLanguage,
        ProficiencyLevel proficiencyLevel,
        String timezone,
        boolean profileCompleted,
        boolean active
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getAvatarUrl(),
                user.getProvider(),
                user.getNativeLanguage(),
                user.getTargetLanguage(),
                user.getProficiencyLevel(),
                user.getTimezone(),
                user.isProfileCompleted(),
                user.isActive()
        );
    }
}
