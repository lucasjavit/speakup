package com.speakup.application.session;

import java.util.UUID;

/**
 * Exception thrown when a session is not found.
 */
public class SessionNotFoundException extends RuntimeException {

    public SessionNotFoundException(UUID id) {
        super("Session not found: " + id);
    }

    public SessionNotFoundException(String message) {
        super(message);
    }
}
