package com.speakup.application.user.dto;

import com.speakup.domain.user.Language;
import com.speakup.domain.user.ProficiencyLevel;
import com.speakup.domain.user.User;

import java.time.Instant;
import java.util.UUID;

/**
 * DTO for user response.
 * ID Number is masked for privacy (GDPR/LGPD compliance).
 */
public record UserResponse(
        UUID id,
        String email,
        String name,
        String avatarUrl,
        String maskedIdNumber,
        String country,
        String city,
        String address,
        Language nativeLanguage,
        Language targetLanguage,
        ProficiencyLevel proficiencyLevel,
        ProficiencyLevel evaluatedLevel,
        Integer totalEvaluations,
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
                maskIdNumber(user.getIdNumber()),
                user.getCountry(),
                user.getCity(),
                user.getAddress(),
                user.getNativeLanguage(),
                user.getTargetLanguage(),
                user.getProficiencyLevel(),
                user.getEvaluatedLevel(),
                user.getTotalEvaluations(),
                user.getTimezone(),
                user.isProfileCompleted(),
                user.isActive(),
                user.getCreatedAt()
        );
    }

    /**
     * Mask ID number for privacy. Shows only last 4 characters.
     * Example: "123456789" becomes "****6789"
     */
    public static String maskIdNumber(String idNumber) {
        if (idNumber == null || idNumber.isEmpty()) {
            return null;
        }
        if (idNumber.length() <= 4) {
            return "****";
        }
        return "****" + idNumber.substring(idNumber.length() - 4);
    }
}
