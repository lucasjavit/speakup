package com.speakup.application.consent.dto;

import com.speakup.domain.consent.ConsentType;
import com.speakup.domain.consent.UserConsent;

import java.time.Instant;

/**
 * Response DTO for consent information.
 */
public record ConsentResponse(
    ConsentType consentType,
    boolean consented,
    Instant consentedAt,
    Instant withdrawnAt
) {
    public static ConsentResponse from(UserConsent consent) {
        return new ConsentResponse(
            consent.getConsentType(),
            consent.isConsented(),
            consent.getConsentedAt(),
            consent.getWithdrawnAt()
        );
    }
}
