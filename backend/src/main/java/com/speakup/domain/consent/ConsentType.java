package com.speakup.domain.consent;

/**
 * Types of consent that can be given by users for GDPR/LGPD compliance.
 */
public enum ConsentType {
    /**
     * Consent for processing personal data (name, email, ID number, location).
     * Required for using the platform.
     */
    DATA_PROCESSING,

    /**
     * Consent for recording video/audio during conversation sessions.
     * Optional - users can participate without recording.
     */
    RECORDING,

    /**
     * Consent for receiving marketing communications.
     * Optional - users can opt out at any time.
     */
    MARKETING
}
