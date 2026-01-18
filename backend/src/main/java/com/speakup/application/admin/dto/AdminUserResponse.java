package com.speakup.application.admin.dto;

import com.speakup.domain.user.AuthProvider;
import com.speakup.domain.user.Language;
import com.speakup.domain.user.ProficiencyLevel;
import com.speakup.domain.user.Role;
import com.speakup.domain.user.User;

import java.time.Instant;
import java.util.UUID;

/**
 * Admin response containing user information.
 */
public record AdminUserResponse(
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
        boolean active,
        Role role,
        Instant createdAt,
        Instant updatedAt
) {
    public static AdminUserResponse from(User user) {
        return new AdminUserResponse(
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
                user.isActive(),
                user.getRole(),
                user.getCreatedAt(),
                user.getUpdatedAt()
        );
    }
}
