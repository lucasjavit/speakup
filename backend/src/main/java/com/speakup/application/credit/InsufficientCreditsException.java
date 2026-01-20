package com.speakup.application.credit;

import java.util.UUID;

/**
 * Exception thrown when a user has insufficient credits.
 */
public class InsufficientCreditsException extends RuntimeException {

    public InsufficientCreditsException(UUID userId) {
        super("User has insufficient credits: " + userId);
    }

    public InsufficientCreditsException(UUID userId, String message) {
        super("User " + userId + " has insufficient credits: " + message);
    }
}
