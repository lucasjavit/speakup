package com.speakup.domain.shared;

/**
 * Exception thrown when an operation is forbidden due to business rules.
 */
public class ForbiddenOperationException extends DomainException {

    public ForbiddenOperationException(String message) {
        super(message);
    }
}
