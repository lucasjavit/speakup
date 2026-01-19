package com.speakup.application.consent;

import com.speakup.domain.consent.ConsentType;
import com.speakup.domain.shared.DomainException;

import java.util.UUID;

/**
 * Exception thrown when a consent record is not found.
 */
public class ConsentNotFoundException extends DomainException {

    public ConsentNotFoundException(UUID userId, ConsentType consentType) {
        super("Consent of type " + consentType + " not found for user " + userId);
    }
}
