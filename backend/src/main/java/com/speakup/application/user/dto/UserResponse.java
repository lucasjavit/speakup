package com.speakup.application.user.dto;

import com.speakup.domain.user.Language;
import com.speakup.domain.user.ProficiencyLevel;
import com.speakup.domain.user.Role;
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
        String phoneCountryCode,
        String phoneNumber,
        Language nativeLanguage,
        Language targetLanguage,
        ProficiencyLevel proficiencyLevel,
        ProficiencyLevel evaluatedLevel,
        Integer totalEvaluations,
        String timezone,
        String openaiApiKey,
        boolean profileCompleted,
        boolean active,
        Role role,
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
                user.getPhoneCountryCode(),
                user.getPhoneNumber(),
                user.getNativeLanguage(),
                user.getTargetLanguage(),
                user.getProficiencyLevel(),
                user.getEvaluatedLevel(),
                user.getTotalEvaluations(),
                user.getTimezone(),
                maskApiKey(user.getOpenaiApiKey()),
                user.isProfileCompleted(),
                user.isActive(),
                user.getRole(),
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

    /**
     * Mask API key for privacy. Shows only first 4 and last 4 characters.
     * Example: "sk-proj-abcdef123456" becomes "sk-p****3456"
     * Returns "configured" if key exists to indicate presence without exposing data.
     */
    public static String maskApiKey(String apiKey) {
        if (apiKey == null || apiKey.isEmpty()) {
            return null;
        }
        // Return a simple indicator that key is configured
        return "configured";
    }
}
