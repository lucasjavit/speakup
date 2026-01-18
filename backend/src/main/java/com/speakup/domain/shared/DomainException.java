package com.speakup.domain.shared;

/**
 * Base exception for domain-level errors.
 * All domain exceptions should extend this class.
 */
public abstract class DomainException extends RuntimeException {

    protected DomainException(String message) {
        super(message);
    }

    protected DomainException(String message, Throwable cause) {
        super(message, cause);
    }
}
