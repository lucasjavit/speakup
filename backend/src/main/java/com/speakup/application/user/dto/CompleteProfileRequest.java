package com.speakup.application.user.dto;

import com.speakup.domain.user.Language;
import com.speakup.domain.user.ProficiencyLevel;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

/**
 * DTO for completing user profile.
 */
public record CompleteProfileRequest(
        @NotBlank(message = "ID number is required")
        String idNumber,

        @NotBlank(message = "Country is required")
        String country,

        @NotBlank(message = "City is required")
        String city,

        String address,

        @NotBlank(message = "Phone country code is required")
        String phoneCountryCode,

        @NotBlank(message = "Phone number is required")
        String phoneNumber,

        @NotNull(message = "Native language is required")
        Language nativeLanguage,

        @NotNull(message = "Target language is required")
        Language targetLanguage,

        @NotNull(message = "Proficiency level is required")
        ProficiencyLevel proficiencyLevel,

        @NotBlank(message = "Timezone is required")
        String timezone
) {
}
