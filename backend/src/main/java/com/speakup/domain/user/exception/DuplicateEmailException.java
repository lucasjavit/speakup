package com.speakup.domain.user.exception;

import com.speakup.domain.shared.DomainException;

/**
 * Exception thrown when trying to register with an email that already exists.
 */
public class DuplicateEmailException extends DomainException {

    public DuplicateEmailException(String email) {
        super("Email already registered: " + email);
    }
}
