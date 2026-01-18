package com.speakup.application.user.dto;

import com.speakup.domain.user.Language;
import com.speakup.domain.user.ProficiencyLevel;
import com.speakup.domain.user.User;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO for user response.
 */
public record UserResponse(
        UUID id,
        String email,
        String name,
        String avatarUrl,
        Language nativeLanguage,
        Language targetLanguage,
        ProficiencyLevel proficiencyLevel,
        String timezone,
        boolean profileCompleted,
        boolean active,
        Instant createdAt
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getAvatarUrl(),
                user.getNativeLanguage(),
                user.getTargetLanguage(),
                user.getProficiencyLevel(),
                user.getTimezone(),
                user.isProfileCompleted(),
                user.isActive(),
                user.getCreatedAt()
        );
    }
}
