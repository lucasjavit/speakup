package com.speakup.application.auth.dto;

import com.speakup.domain.user.AuthProvider;
import com.speakup.domain.user.Language;
import com.speakup.domain.user.ProficiencyLevel;
import com.speakup.domain.user.Role;
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
        String idNumber,
        String country,
        String city,
        String address,
        String phoneCountryCode,
        String phoneNumber,
        Language nativeLanguage,
        Language targetLanguage,
        ProficiencyLevel proficiencyLevel,
        ProficiencyLevel evaluatedLevel,
        Integer totalEvaluations,
        String timezone,
        boolean profileCompleted,
        boolean active,
        Role role
) {
    public static UserResponse from(User user) {
        return new UserResponse(
                user.getId(),
                user.getEmail(),
                user.getName(),
                user.getAvatarUrl(),
                user.getProvider(),
                user.getIdNumber(),
                user.getCountry(),
                user.getCity(),
                user.getAddress(),
                user.getPhoneCountryCode(),
                user.getPhoneNumber(),
                user.getNativeLanguage(),
                user.getTargetLanguage(),
                user.getProficiencyLevel(),
                user.getEvaluatedLevel(),
                user.getTotalEvaluations(),
                user.getTimezone(),
                user.isProfileCompleted(),
                user.isActive(),
                user.getRole()
        );
    }
}
