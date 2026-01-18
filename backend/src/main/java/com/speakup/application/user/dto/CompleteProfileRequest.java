package com.speakup.application.user.dto;

import com.speakup.domain.user.Language;
import com.speakup.domain.user.ProficiencyLevel;
import jakarta.validation.constraints.NotNull;

/**
 * DTO for completing user profile.
 */
public record CompleteProfileRequest(
        @NotNull(message = "Native language is required")
        Language nativeLanguage,

        @NotNull(message = "Target language is required")
        Language targetLanguage,

        @NotNull(message = "Proficiency level is required")
        ProficiencyLevel proficiencyLevel,

        String timezone
) {
}
