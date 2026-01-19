package com.speakup.application.consent.dto;

import com.speakup.domain.consent.ConsentType;
import jakarta.validation.constraints.NotNull;

/**
 * Request DTO for granting consent.
 */
public record ConsentRequest(
    @NotNull(message = "Consent type is required")
    ConsentType consentType
) {}
